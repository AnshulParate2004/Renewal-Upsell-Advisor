"""
Real-time voice conversation API endpoints using base64 audio streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.services.voicebot_frontend.audio_handler import (
    process_audio_conversation,
    process_audio_conversation_streaming,
    text_to_speech_base64,
)
from app.services.voicebot_frontend.conversation_handler import frontend_voice_bot_handler
from app.services.email.scheduler import get_supabase_client
from app.core.logging import get_logger
import json
import uuid

logger = get_logger(__name__)
router = APIRouter()


class AudioRequest(BaseModel):
    """Audio request model."""
    audio_base64: str
    session_id: Optional[str] = None
    account_id: Optional[str] = None


class AudioResponse(BaseModel):
    """Audio response model."""
    audio_base64: str
    transcribed_text: str
    session_id: str


@router.post("/audio/process", response_model=AudioResponse)
async def process_audio(request: AudioRequest):
    """
    Process audio conversation: STT -> LLM -> TTS -> return base64 audio.
    
    Args:
        request: Audio request with base64 audio data
        
    Returns:
        Audio response with base64 audio and transcribed text
    """
    try:
        # Generate or use session ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get user context if account_id is provided
        user_context = None
        if request.account_id:
            client = get_supabase_client()
            if client:
                try:
                    account_result = client.table("accounts").select("*").eq("id", request.account_id).execute()
                    if account_result.data:
                        account = account_result.data[0]
                        user_context = {
                            "account_name": account.get("name", ""),
                            "renewal_date": account.get("renewal_date", ""),
                            "health_score": account.get("health_score"),
                        }
                except Exception as e:
                    logger.error(f"Failed to fetch account context: {e}")
        
        # Process audio conversation
        audio_response_base64, transcribed_text = process_audio_conversation(
            audio_base64=request.audio_base64,
            session_id=session_id,
            user_context=user_context
        )
        
        return AudioResponse(
            audio_base64=audio_response_base64,
            transcribed_text=transcribed_text,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}", exc_info=True)
        # Return empty response on error
        return AudioResponse(
            audio_base64="",
            transcribed_text="",
            session_id=request.session_id or str(uuid.uuid4())
        )


@router.get("/audio/greeting")
async def get_greeting_audio(account_id: Optional[str] = None):
    """
    Get initial greeting as base64 audio.
    
    Args:
        account_id: Optional account ID for context
        
    Returns:
        Base64 encoded audio and session ID
    """
    try:
        user_context = None
        if account_id:
            client = get_supabase_client()
            if client:
                try:
                    account_result = client.table("accounts").select("*").eq("id", account_id).execute()
                    if account_result.data:
                        account = account_result.data[0]
                        user_context = {
                            "account_name": account.get("name", ""),
                            "renewal_date": account.get("renewal_date", ""),
                            "health_score": account.get("health_score"),
                        }
                except Exception as e:
                    logger.error(f"Failed to fetch account context: {e}")
        
        greeting_text = frontend_voice_bot_handler.get_initial_greeting(user_context)
        audio_base64 = text_to_speech_base64(greeting_text)
        
        return {
            "audio_base64": audio_base64,
            "greeting_text": greeting_text,
            "session_id": str(uuid.uuid4())
        }
        
    except Exception as e:
        logger.error(f"Error getting greeting audio: {e}", exc_info=True)
        return {
            "audio_base64": "",
            "greeting_text": "Hello! How can I assist you today?",
            "session_id": str(uuid.uuid4())
        }


@router.websocket("/audio/ws")
async def audio_websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming.
    Receives base64 audio chunks and sends back base64 audio responses.
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())
    user_context = None
    
    try:
        # Send initial greeting audio
        greeting_text = frontend_voice_bot_handler.get_initial_greeting(user_context)
        greeting_audio_base64 = text_to_speech_base64(greeting_text)
        
        await websocket.send_json({
            "type": "greeting",
            "audio_base64": greeting_audio_base64,
            "text": greeting_text,
            "session_id": session_id
        })
        
        while True:
            # Receive audio data from client
            data = await websocket.receive_json()
            
            message_type = data.get("type", "audio")
            
            if message_type == "init":
                # Update session_id if provided
                provided_session_id = data.get("session_id")
                if provided_session_id:
                    session_id = provided_session_id
                account_id = data.get("account_id")
                
                # Fetch user context if account_id provided
                if account_id:
                    client = get_supabase_client()
                    if client:
                        try:
                            account_result = client.table("accounts").select("*").eq("id", account_id).execute()
                            if account_result.data:
                                account = account_result.data[0]
                                user_context = {
                                    "account_name": account.get("name", ""),
                                    "renewal_date": account.get("renewal_date", ""),
                                    "health_score": account.get("health_score"),
                                }
                        except Exception as e:
                            logger.error(f"Failed to fetch account context: {e}")
            
            elif message_type == "audio":
                audio_base64 = data.get("audio_base64", "")
                if not audio_base64:
                    continue
                try:
                    # Streaming: STT -> stream LLM by sentence -> TTS per phrase -> send chunks
                    for chunk_b64, chunk_index, is_final, transcribed_text in process_audio_conversation_streaming(
                        audio_base64=audio_base64,
                        session_id=session_id,
                        user_context=user_context,
                        audio_format="webm",
                    ):
                        payload = {
                            "type": "audio_chunk",
                            "chunk_index": chunk_index,
                            "is_final": is_final,
                            "session_id": session_id,
                        }
                        if chunk_b64:
                            payload["audio_base64"] = chunk_b64
                        if is_final and transcribed_text:
                            payload["transcribed_text"] = transcribed_text
                        await websocket.send_json(payload)
                except Exception as e:
                    logger.error(f"Error processing audio in WebSocket: {e}", exc_info=True)
                    await websocket.send_json({
                        "type": "error",
                        "message": "Error processing audio",
                    })
            
            elif message_type == "clear":
                frontend_voice_bot_handler.clear_session(session_id)
                greeting_text = frontend_voice_bot_handler.get_initial_greeting(user_context)
                greeting_audio_base64 = text_to_speech_base64(greeting_text)
                await websocket.send_json({
                    "type": "greeting",
                    "audio_base64": greeting_audio_base64,
                    "text": greeting_text,
                    "session_id": session_id
                })
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": "An error occurred. Please try again."
            })
        except:
            pass
