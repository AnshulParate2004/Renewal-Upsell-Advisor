import json
import struct
import math
import asyncio
import functools
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

from app.services.email.scheduler import get_supabase_client
from app.services.voice_agent.voice_conversation import voice_conversation_handler
from app.services.voice_agent.azure_speech import azure_speech
from app.services.voice_agent.voice_call_scheduler import calculate_plan_completion_percentage
from app.core.logging import get_logger

logger = get_logger(__name__)

# Protocol Constants
CUBE_MSG_HANGUP   = 0x00
CUBE_MSG_AUDIO    = 0x10
CUBE_MSG_CLI_DNI  = 0x20
CUBE_MSG_DTMF     = 0x30

# Audio configuration
CHUNKS_PER_SECOND = 50      # 20ms chunks = 50 per second (VoIP standard)
SILENCE_THRESHOLD_RMS = 500 # Adjust based on testing
SILENCE_DURATION_SECS = 1.5 # 1.5 seconds of silence means they stopped speaking
INTERRUPT_DURATION_SECS = 0.4 # Need 400ms of speech to interrupt AI
GREETING_WARMUP_SECS = 1.0  # Don't allow interrupts for 1s after AI starts speaking


def get_rms(pcm_data: bytes) -> float:
    """Calculate the Root Mean Square of PCM 16-bit audio data."""
    count = len(pcm_data) // 2
    if count == 0:
        return 0.0
    try:
        shorts = struct.unpack(f"<{count}h", pcm_data)
        sum_squares = sum(s * s for s in shorts)
        return math.sqrt(sum_squares / count)
    except Exception as e:
        logger.warning(f"Error calculating RMS: {e}")
        return 0.0


def build_audio_packet(pcm_data: bytes) -> bytes:
    """Wrap PCM audio in the 0x10 binary envelope."""
    length = len(pcm_data)
    header = struct.pack('>BH', CUBE_MSG_AUDIO, length)
    return header + pcm_data


class CubeWebsocketSession:
    """Manages the lifecycle of a single WebRTC-style Cube Voice call."""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.client = get_supabase_client()
        self.connected = False
        
        # Call specific
        self.call_id = None
        self.account_id = None
        self.account = None
        self.usage_percentage = 0.0
        self.call_type = "check_in"
        
        # Audio Buffering and VAD
        self.audio_buffer = bytearray()
        self.silence_chunks = 0
        self.speech_chunks = 0
        self.is_speaking = False
        
        # Conversation state
        self.transcript = ""
        self.conversation_history = []
        
        # AI playback state
        self.ai_is_speaking = False
        self.ai_playback_task = None
        self.ai_speech_start_time = 0.0  # monotonic time when AI started speaking
        
    async def run(self):
        """Main WebSocket loop."""
        await self.websocket.accept()
        self.connected = True
        logger.info("[CUBE-WS] WebSocket connection accepted.")
        
        try:
            while True:
                message = await self.websocket.receive()
                
                if "bytes" in message:
                    await self.handle_binary_message(message["bytes"])
                elif "text" in message:
                    # Not standard per guide, but good to log
                    logger.debug(f"[CUBE-WS] Received text msg: {message['text'][:50]}")
                    
        except WebSocketDisconnect:
            logger.info("[CUBE-WS] Client disconnected natively.")
            await self.cleanup()
        except Exception as e:
            logger.error(f"[CUBE-WS] Exception in run loop: {e}", exc_info=True)
            await self.cleanup()

    async def handle_binary_message(self, data: bytes):
        """Decode and process binary frames from Cube Platform."""
        if len(data) == 0:
            return
            
        msg_type = data[0]
        
        if msg_type == CUBE_MSG_CLI_DNI:
            await self.process_cli_dni(data[1:])
            
        elif msg_type == CUBE_MSG_AUDIO:
            if len(data) > 3:
                length = struct.unpack('>H', data[1:3])[0]
                pcm_payload = data[3:3 + length]
                await self.process_caller_audio(pcm_payload)
                
        elif msg_type == CUBE_MSG_DTMF:
            if len(data) > 1:
                digit = chr(data[1])
                logger.info(f"[CUBE-WS] Received DTMF: {digit}")
                # We can process DTMF routing here if needed
                
        elif msg_type == CUBE_MSG_HANGUP:
            logger.info("[CUBE-WS] Received HANGUP (0x00). Ending call.")
            await self.cleanup()
            
    async def process_cli_dni(self, payload: bytes):
        """Handle the initial Caller ID / DNI payload from Cube to start the call."""
        try:
            json_str = payload.decode('utf-8')
            info = json.loads(json_str)
            raw_phone = info.get("phone") or info.get("CLI") or info.get("cli") or info.get("phone_number") or ""
            
            # Normalize phone (take last 10 digits as simple logic)
            phone_digits = "".join(filter(str.isdigit, raw_phone))
            if len(phone_digits) >= 10:
                normalized_phone = phone_digits[-10:]
            else:
                normalized_phone = phone_digits
                
            logger.info(f"[CUBE-WS] Call starting for phone: {normalized_phone} (Raw: {raw_phone})")
            
            # Look up account in database
            if self.client:
                result = self.client.table("accounts").select("*").ilike("primary_contact_phone", f"%{normalized_phone}%").limit(1).execute()
                if result.data:
                    self.account = result.data[0]
                    self.account_id = self.account.get("id")
                    self.usage_percentage = calculate_plan_completion_percentage(self.account)
                    logger.info(f"[CUBE-WS] Found account {self.account.get('name')}! Usage: {self.usage_percentage:.0f}%")
                else:
                    logger.warning(f"[CUBE-WS] No account found for {normalized_phone}")
            
            # Save a DB record for this call
            if self.account_id and self.client:
                call_record = self.client.table("voice_calls").insert({
                    "account_id": self.account_id,
                    "call_type": self.call_type,
                    "phone_number": raw_phone,
                    "status": "in_progress",
                    "attempted_at": datetime.now(timezone.utc).isoformat(),
                    "metadata": {"usage_percentage": self.usage_percentage, "cube_ws": True}
                }).execute()
                if call_record.data:
                    self.call_id = call_record.data[0]["id"]
            
            # Generate the initial greeting!
            script = voice_conversation_handler.get_conversation_script(
                account=self.account,
                usage_percentage=self.usage_percentage,
                call_type=self.call_type
            )
            
            if not script or len(script) < 5:
                script = f"Hello. I'm calling from Renewal and Upsell Advisor regarding your account. How can I help you today?"
                
            self.transcript = f"Agent: {script}"
            self.conversation_history.append({"role": "assistant", "content": script})
            
            # Start playing the greeting audio
            await self.stream_ai_response(script)
            
        except Exception as e:
            logger.error(f"[CUBE-WS] Error parsing CLI_DNI payload: {e}")

    async def process_caller_audio(self, pcm_data: bytes):
        """Handle incoming raw audio from the user (VAD and buffering)."""
        rms = get_rms(pcm_data)
        
        if rms > SILENCE_THRESHOLD_RMS:
            # Caller is speaking!
            self.is_speaking = True
            self.silence_chunks = 0
            self.speech_chunks += 1
            
            # Have they interrupted the AI?
            # Guard: don't allow interrupts during the warmup period
            elapsed_since_ai_start = time.monotonic() - self.ai_speech_start_time
            if (self.ai_is_speaking
                    and self.speech_chunks >= (INTERRUPT_DURATION_SECS * CHUNKS_PER_SECOND)
                    and elapsed_since_ai_start > GREETING_WARMUP_SECS):
                await self.interrupt_ai()
                
            # Buffer the audio
            self.audio_buffer.extend(pcm_data)
            
        else:
            # Silence
            if self.is_speaking:
                self.silence_chunks += 1
                self.audio_buffer.extend(pcm_data) # Keep silence in buffer for natural flow
                
                # Did they stop speaking?
                if self.silence_chunks >= (SILENCE_DURATION_SECS * CHUNKS_PER_SECOND):
                    # They finished their sentence! Process it.
                    await self.process_full_utterance()
                    
    async def interrupt_ai(self):
        """User spoke over the AI. Stop AI playback."""
        logger.info(f"[CUBE-WS] Caller interrupted. Sending clear event.")
        self.ai_is_speaking = False
        
        # Stop background streaming task if running
        if self.ai_playback_task and not self.ai_playback_task.done():
            self.ai_playback_task.cancel()
            
        # Send clear event to Cube
        clear_event = json.dumps({"event": "clear"}).encode('utf-8')
        try:
            await self.websocket.send_bytes(clear_event)
        except Exception as e:
            logger.warning(f"Failed to send clear event: {e}")

    async def process_full_utterance(self):
        """Flush the audio buffer to STT, get text, generate response, and reply."""
        self.is_speaking = False
        self.speech_chunks = 0
        self.silence_chunks = 0
        
        # Capture buffer and clear it immediately for next utterance
        audio_payload = bytes(self.audio_buffer)
        self.audio_buffer.clear()
        
        if len(audio_payload) < 8000:  # Less than half a second of audio
            return
            
        logger.info(f"[CUBE-WS] Flushing {len(audio_payload)} bytes of audio to STT...")
        
        try:
            user_text = azure_speech.speech_to_text(audio_payload, is_raw_pcm_8k=True)
            if not user_text:
                return
                
            logger.info(f"[CUBE-WS] User said: {user_text}")
            self.transcript += f"\nUser: {user_text}"
            self.conversation_history.append({"role": "user", "content": user_text})
            
            # Did they say goodbye?
            if any(w in user_text.lower() for w in ['goodbye', 'bye', 'hang up', 'stop']):
                await self.stream_ai_response("Thank you for your time. Have a great day!")
                await asyncio.sleep(2)
                
                # Send hangup
                await self.websocket.send_bytes(bytes([CUBE_MSG_HANGUP]))
                await self.cleanup()
                return

            # Generate AI Response from LLM as a stream
            generator = voice_conversation_handler.generate_dynamic_response_stream(
                account=self.account,
                user_input=user_text,
                conversation_context=self.conversation_history,
                usage_percentage=self.usage_percentage,
                call_type=self.call_type
            )
            
            # Stream response back immediately to reduce perceived latency
            await self.process_llm_stream(generator)
            
        except Exception as e:
            logger.error(f"[CUBE-WS] Error processing utterance: {e}", exc_info=True)
            await self.stream_ai_response("I apologize, I didn't catch that. Could you repeat?")

    async def _stream_audio_for_text(self, text: str):
        """Get PCM audio from Azure and stream chunks to websocket."""
        loop = asyncio.get_running_loop()
        pcm_data = await loop.run_in_executor(
            None,
            functools.partial(azure_speech.text_to_speech, text, raw_8k=True)
        )
        
        logger.info(f"[CUBE-WS] TTS generated {len(pcm_data)} bytes of audio.")
        
        # 2. Stream in 20ms (320 byte) chunks — VoIP standard pacing
        CHUNK_SIZE = 320  # 20ms at 8000Hz 16-bit mono
        packages_sent = 0
        
        offset = 0
        while offset < len(pcm_data):
            if not self.ai_is_speaking:
                logger.info(f"[CUBE-WS] Playback interrupted after {packages_sent} packets.")
                break
                
            chunk = pcm_data[offset:offset + CHUNK_SIZE]
            offset += CHUNK_SIZE
            
            if len(chunk) == 0:
                break
                
            if len(chunk) % 2 != 0:
                chunk = chunk[:-1]
                
            packet = build_audio_packet(chunk)
            await self.websocket.send_bytes(packet)
            packages_sent += 1
            
            # Wait 20ms — real-time pacing so Cube can play smoothly
            await asyncio.sleep(0.02)
        
        logger.info(f"[CUBE-WS] Finished streaming {packages_sent} audio packets.")

    async def process_llm_stream(self, generator):
        """Buffer tokens into sentences and push to playback queue."""
        full_response = ""
        current_sentence = ""
        
        self.ai_is_speaking = True
        self.ai_speech_start_time = time.monotonic()
        
        sentence_queue = asyncio.Queue()
        
        async def play_audio_from_queue():
            try:
                while True:
                    sentence = await sentence_queue.get()
                    if sentence is None: # End of stream signal
                        break
                    if not self.ai_is_speaking: # Interrupted
                        break
                    await self._stream_audio_for_text(sentence)
                    sentence_queue.task_done()
            except asyncio.CancelledError:
                pass
            finally:
                self.ai_is_speaking = False
                
        # Fire up the consumer task
        self.ai_playback_task = asyncio.create_task(play_audio_from_queue())
        
        try:
            async for chunk in generator:
                if not self.ai_is_speaking:
                    break
                    
                full_response += chunk
                current_sentence += chunk
                
                # Check for sentence end markers
                if any(punct in chunk for punct in ['.', '!', '?', '\n']):
                    sentence_to_send = current_sentence.strip()
                    if len(sentence_to_send) > 5:
                        await sentence_queue.put(sentence_to_send)
                        current_sentence = ""
            
            if current_sentence.strip() and self.ai_is_speaking:
                await sentence_queue.put(current_sentence.strip())
                
            await sentence_queue.put(None)
            await self.ai_playback_task
            
        except Exception as e:
            logger.error(f"[CUBE-WS] Error in LLM stream: {e}", exc_info=True)
            if current_sentence.strip():
                full_response += " " + current_sentence
        finally:
            if not full_response.strip():
                full_response = "I understand. Is there anything else I can help you with?"
                await self._stream_audio_for_text(full_response)
                
            self.transcript += f"\nAgent: {full_response}"
            self.conversation_history.append({"role": "assistant", "content": full_response})

    async def stream_ai_response(self, text: str):
        """Convert text to speech and send it to the client in streaming mode."""
        if not text:
            return
            
        logger.info(f"[CUBE-WS] Streaming TTS for text: {text[:50]}...")
        
        async def playback_task():
            self.ai_is_speaking = True
            self.ai_speech_start_time = time.monotonic()
            try:
                await self._stream_audio_for_text(text)
            except asyncio.CancelledError:
                logger.info("[CUBE-WS] Playback task cancelled (interrupt).")
            except Exception as e:
                logger.error(f"[CUBE-WS] Error in TTS stream: {e}", exc_info=True)
            finally:
                self.ai_is_speaking = False
                
        self.ai_playback_task = asyncio.create_task(playback_task())

    async def cleanup(self):
        """Finalize call logging, outcome, and close."""
        if not self.connected:
            return
            
        self.connected = False
        logger.info(f"[CUBE-WS] Executing cleanup for call_id={self.call_id}")
        
        if self.ai_playback_task and not self.ai_playback_task.done():
            self.ai_playback_task.cancel()
            
        try:
            if self.call_id and self.client:
                # Try to determine outcome based on transcript
                outcome = voice_conversation_handler.get_call_outcome(self.transcript, self.usage_percentage, self.usage_percentage >= 90)
                
                self.client.table("voice_calls").update({
                    "status": "completed",
                    "transcript": self.transcript,
                    "outcome": outcome,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", self.call_id).execute()
        except Exception as e:
            logger.error(f"[CUBE-WS] Cleanup error saving DB: {e}")
            
        try:
            await self.websocket.close()
        except:
            pass
