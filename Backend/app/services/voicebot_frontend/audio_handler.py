"""
Audio handler for real-time voice conversation using Azure Speech Service.
Handles base64 audio encoding/decoding and speech processing.
"""
import base64
from typing import Optional
from app.services.voice_agent.azure_speech import azure_speech
from app.services.voicebot_frontend.conversation_handler import frontend_voice_bot_handler
from app.services.voicebot_frontend.audio_converter import convert_to_pcm_wav
from app.core.logging import get_logger
import io

logger = get_logger(__name__)


def process_audio_conversation(
    audio_base64: str,
    session_id: str,
    user_context: Optional[dict] = None,
    audio_format: str = "webm"
) -> tuple[str, str]:
    """
    Process audio conversation: STT -> LLM -> TTS -> return base64 audio.
    
    Args:
        audio_base64: Base64 encoded audio data
        session_id: Session ID for conversation tracking
        user_context: Optional user context
        audio_format: Audio format (webm, wav, etc.)
        
    Returns:
        Tuple of (base64_audio_response, transcribed_text)
    """
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_base64)
        
        # Convert WebM to WAV format for Azure Speech Service
        if audio_format.lower() == "webm":
            try:
                logger.info("Converting WebM to WAV format for Azure Speech")
                audio_bytes = convert_to_pcm_wav(audio_bytes, input_format="webm", sample_rate=16000, channels=1)
                audio_format = "wav"
            except Exception as e:
                logger.error(f"Failed to convert WebM to WAV: {e}", exc_info=True)
                # Try with original format as fallback
                pass
        
        # Speech-to-Text using Azure Speech
        transcribed_text = azure_speech.speech_to_text(
            audio_bytes, 
            language="en-US",
            audio_format=audio_format
        )
        
        if not transcribed_text or not transcribed_text.strip():
            logger.warning("No speech detected in audio")
            return "", ""
        
        logger.info(f"Transcribed: {transcribed_text}")
        
        # Get conversation history
        conversation_history = frontend_voice_bot_handler.get_conversation_history(session_id)
        
        # Generate response using LLM
        response_text = frontend_voice_bot_handler.generate_response(
            user_input=transcribed_text,
            session_id=session_id,
            conversation_history=conversation_history,
            user_context=user_context
        )
        
        logger.info(f"Generated response: {response_text[:100]}...")
        
        # Text-to-Speech using Azure Speech
        audio_response_bytes = azure_speech.text_to_speech(
            response_text,
            voice_name="en-US-AriaNeural"  # Natural female voice
        )
        
        # Encode audio response to base64
        audio_response_base64 = base64.b64encode(audio_response_bytes).decode('utf-8')
        
        return audio_response_base64, transcribed_text
        
    except Exception as e:
        logger.error(f"Error processing audio conversation: {e}", exc_info=True)
        raise


def text_to_speech_base64(text: str, voice_name: Optional[str] = None) -> str:
    """
    Convert text to base64 encoded audio.
    
    Args:
        text: Text to convert
        voice_name: Optional voice name
        
    Returns:
        Base64 encoded audio
    """
    try:
        audio_bytes = azure_speech.text_to_speech(text, voice_name)
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"Error converting text to speech: {e}", exc_info=True)
        raise
