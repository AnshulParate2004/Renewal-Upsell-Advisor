"""
Frontend Voice Bot API endpoints.
Handles voice conversations for the frontend interface.
"""
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.services.voicebot_frontend.conversation_handler import frontend_voice_bot_handler
from app.services.email.scheduler import get_supabase_client
from app.core.logging import get_logger
import json
import uuid

logger = get_logger(__name__)
router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model."""
    message: str
    session_id: Optional[str] = None
    account_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str
    session_id: str
    timestamp: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, message: ChatMessage):
    """
    Handle chat message from frontend.
    
    Args:
        request: FastAPI request
        message: Chat message
        
    Returns:
        Chat response
    """
    try:
        # Generate or use session ID
        session_id = message.session_id or str(uuid.uuid4())
        
        # Get user context if account_id is provided
        user_context = None
        if message.account_id:
            client = get_supabase_client()
            if client:
                try:
                    account_result = client.table("accounts").select("*").eq("id", message.account_id).execute()
                    if account_result.data:
                        account = account_result.data[0]
                        user_context = {
                            "account_name": account.get("name", ""),
                            "renewal_date": account.get("renewal_date", ""),
                            "health_score": account.get("health_score"),
                            "utilization_percentage": account.get("utilization_percentage"),
                        }
                except Exception as e:
                    logger.error(f"Failed to fetch account context: {e}")
        
        # Get conversation history
        conversation_history = frontend_voice_bot_handler.get_conversation_history(session_id)
        
        # Generate response
        response_text = frontend_voice_bot_handler.generate_response(
            user_input=message.message,
            session_id=session_id,
            conversation_history=conversation_history,
            user_context=user_context
        )
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error handling chat message: {e}", exc_info=True)
        return ChatResponse(
            response="I apologize, but I encountered an error. Please try again.",
            session_id=message.session_id or str(uuid.uuid4()),
            timestamp=datetime.now().isoformat()
        )


@router.get("/greeting")
async def get_greeting(account_id: Optional[str] = None):
    """
    Get initial greeting message.
    
    Args:
        account_id: Optional account ID for context
        
    Returns:
        Greeting message
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
        
        greeting = frontend_voice_bot_handler.get_initial_greeting(user_context)
        
        return {
            "greeting": greeting,
            "session_id": str(uuid.uuid4())
        }
        
    except Exception as e:
        logger.error(f"Error getting greeting: {e}", exc_info=True)
        return {
            "greeting": "Hello! I'm your Renewal & Upsell Advisor assistant. How can I assist you today?",
            "session_id": str(uuid.uuid4())
        }


@router.post("/session/{session_id}/clear")
async def clear_session(session_id: str):
    """
    Clear conversation session.
    
    Args:
        session_id: Session ID
        
    Returns:
        Success message
    """
    try:
        frontend_voice_bot_handler.clear_session(session_id)
        return {"message": "Session cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing session: {e}", exc_info=True)
        return {"message": "Failed to clear session"}


@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """
    Get conversation history for a session.
    
    Args:
        session_id: Session ID
        
    Returns:
        Conversation history
    """
    try:
        history = frontend_voice_bot_handler.get_conversation_history(session_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"Error getting session history: {e}", exc_info=True)
        return {"history": []}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time voice bot conversations with streaming support.
    
    Args:
        websocket: WebSocket connection
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())
    user_context = None
    
    try:
        # Send initial greeting
        greeting = frontend_voice_bot_handler.get_initial_greeting(user_context)
        await websocket.send_json({
            "type": "greeting",
            "message": greeting,
            "session_id": session_id
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            message_type = data.get("type", "message")
            
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
                
            elif message_type == "message":
                user_input = data.get("message", "")
                account_id = data.get("account_id")
                
                # Update user context if account_id provided
                if account_id and not user_context:
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
                
                # Get conversation history
                conversation_history = frontend_voice_bot_handler.get_conversation_history(session_id)
                
                # Generate response (optimized for low latency)
                try:
                    response = frontend_voice_bot_handler.generate_response(
                        user_input=user_input,
                        session_id=session_id,
                        conversation_history=conversation_history,
                        user_context=user_context
                    )
                    
                    # Send response immediately (no streaming for now, but optimized)
                    await websocket.send_json({
                        "type": "response",
                        "message": response,
                        "session_id": session_id
                    })
                except Exception as e:
                    logger.error(f"Error generating response: {e}", exc_info=True)
                    await websocket.send_json({
                        "type": "error",
                        "message": "I apologize, but I'm having trouble processing that right now."
                    })
                
            elif message_type == "clear":
                frontend_voice_bot_handler.clear_session(session_id)
                await websocket.send_json({
                    "type": "cleared",
                    "message": "Conversation cleared"
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
