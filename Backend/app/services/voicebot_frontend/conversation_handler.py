"""
Frontend Voice Bot Conversation Handler
Manages conversations for the frontend voice bot interface.
"""
import re
from typing import Dict, Any, Optional, List, Generator
from datetime import datetime
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)

# Sentence boundary for streaming: yield TTS chunks on these
SENTENCE_END_RE = re.compile(r"(?<=[.!?])\s+|\n+")


def get_langchain_llm():
    """Initialize LangChain Azure OpenAI LLM for frontend voice conversations."""
    try:
        api_key = os.getenv("AZURE_OPENAI_API_KEY") or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or settings.AZURE_OPENAI_ENDPOINT
        api_version = os.getenv("OPENAI_API_VERSION") or settings.OPENAI_API_VERSION
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT
        
        if not all([api_key, azure_endpoint, deployment]):
            logger.warning("Azure OpenAI credentials not configured for LangChain")
            return None
        
        llm = AzureChatOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=api_key,
            api_version=api_version,
            azure_deployment=deployment,
            temperature=0.7,
            max_tokens=200,  # Reduced for faster responses
            timeout=10  # 10 second timeout for low latency
        )
        
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LangChain LLM: {e}")
        return None


class FrontendVoiceBotHandler:
    """Handles voice conversations for the frontend interface."""
    
    def __init__(self):
        """Initialize conversation handler."""
        self.conversation_sessions: Dict[str, List[Dict[str, str]]] = {}
    
    def get_initial_greeting(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get initial greeting message for the voice bot.
        
        Args:
            user_context: Optional user context (account info, etc.)
            
        Returns:
            Initial greeting message
        """
        if user_context:
            account_name = user_context.get('account_name', '')
            if account_name:
                return f"Hello! I'm your Renewal & Upsell Advisor assistant. I'm here to help you with {account_name}. How can I assist you today?"
        
        return "Hello! I'm your Renewal & Upsell Advisor assistant. I can help you with renewals, upsells, and customer support. How can I assist you today?"
    
    def generate_response(
        self,
        user_input: str,
        session_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate response to user input using LangChain.
        
        Args:
            user_input: User's input text
            session_id: Session ID for tracking conversation
            conversation_history: Previous conversation messages
            user_context: Optional user context (account info, etc.)
            
        Returns:
            Response text
        """
        llm = get_langchain_llm()
        if not llm:
            # Fallback response
            return "I understand. Is there anything else I can help you with?"
        
        try:
            # Get or create conversation history for this session
            if session_id not in self.conversation_sessions:
                self.conversation_sessions[session_id] = []
            
            # Add user input to history
            self.conversation_sessions[session_id].append({"role": "user", "content": user_input})
            
            # Build context string
            context_str = ""
            if user_context:
                account_name = user_context.get('account_name', '')
                if account_name:
                    context_str += f"Account: {account_name}\n"
                renewal_date = user_context.get('renewal_date', '')
                if renewal_date:
                    context_str += f"Renewal Date: {renewal_date}\n"
                health_score = user_context.get('health_score')
                if health_score is not None:
                    context_str += f"Health Score: {health_score}/100\n"
            
            # Build conversation history string
            conversation_history_str = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    conversation_history_str += f"{role.capitalize()}: {content}\n"
            
            # Create LangChain prompt template
            system_template = """You are a helpful and professional Renewal & Upsell Advisor assistant.
You help Customer Success Managers (CSMs) with:
- Contract renewals
- Upsell opportunities
- Customer support questions
- Account health insights
- Renewal reminders

Guidelines:
- Be friendly, professional, and concise
- Provide actionable insights
- Focus on renewal and upsell opportunities
- Help identify at-risk accounts
- Answer questions about account health, sentiment, and renewal dates

{context}

Previous conversation:
{conversation_history}

Respond naturally and helpfully to what the user asks."""
            
            human_template = """User: {user_input}

Your response:"""
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template)
            ])
            
            # Create chain
            chain = prompt | llm | StrOutputParser()
            
            # Generate response
            response = chain.invoke({
                "context": context_str or "No specific account context available.",
                "conversation_history": conversation_history_str or "This is the start of the conversation.",
                "user_input": user_input
            })
            
            # Add assistant response to history
            self.conversation_sessions[session_id].append({"role": "assistant", "content": response})
            
            # Keep only last 20 messages to avoid memory issues
            if len(self.conversation_sessions[session_id]) > 20:
                self.conversation_sessions[session_id] = self.conversation_sessions[session_id][-20:]
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Failed to generate response with LangChain: {e}", exc_info=True)
            return "I apologize, but I'm having trouble processing that right now. Could you please rephrase your question?"

    def generate_response_stream(
        self,
        user_input: str,
        session_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Generator[str, None, str]:
        """
        Stream LLM response by sentence for low-latency TTS (first phrase plays while rest generates).
        Yields sentence chunks; returns full response when done (caller should add to history if needed).
        """
        llm = get_langchain_llm()
        if not llm:
            fallback = "I understand. Is there anything else I can help you with?"
            yield fallback
            return fallback

        try:
            if session_id not in self.conversation_sessions:
                self.conversation_sessions[session_id] = []
            self.conversation_sessions[session_id].append({"role": "user", "content": user_input})

            context_str = ""
            if user_context:
                if user_context.get("account_name"):
                    context_str += f"Account: {user_context['account_name']}\n"
                if user_context.get("renewal_date"):
                    context_str += f"Renewal Date: {user_context['renewal_date']}\n"
                if user_context.get("health_score") is not None:
                    context_str += f"Health Score: {user_context['health_score']}/100\n"

            conversation_history_str = ""
            if conversation_history:
                for msg in conversation_history[-5:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    conversation_history_str += f"{role.capitalize()}: {content}\n"

            system_template = """You are a helpful and professional Renewal & Upsell Advisor assistant.
You help Customer Success Managers (CSMs) with:
- Contract renewals
- Upsell opportunities
- Customer support questions
- Account health insights
- Renewal reminders

Guidelines:
- Be friendly, professional, and concise
- Provide actionable insights
- Focus on renewal and upsell opportunities
- Help identify at-risk accounts
- Answer questions about account health, sentiment, and renewal dates

{context}

Previous conversation:
{conversation_history}

Respond naturally and helpfully to what the user asks."""

            human_template = """User: {user_input}

Your response:"""

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template),
            ])
            chain = prompt | llm | StrOutputParser()

            full_parts: List[str] = []
            buffer = ""

            for chunk in chain.stream({
                "context": context_str or "No specific account context available.",
                "conversation_history": conversation_history_str or "This is the start of the conversation.",
                "user_input": user_input,
            }):
                if not isinstance(chunk, str):
                    chunk = str(chunk)
                buffer += chunk
                # Yield on sentence boundary (after . ! ?)
                while True:
                    match = SENTENCE_END_RE.search(buffer)
                    if not match:
                        break
                    end = match.end()
                    sentence = buffer[:end].strip()
                    buffer = buffer[end:].lstrip()
                    if sentence:
                        full_parts.append(sentence)
                        yield sentence

            if buffer.strip():
                full_parts.append(buffer.strip())
                yield buffer.strip()

            full_response = " ".join(full_parts)
            self.conversation_sessions[session_id].append({"role": "assistant", "content": full_response})
            if len(self.conversation_sessions[session_id]) > 20:
                self.conversation_sessions[session_id] = self.conversation_sessions[session_id][-20:]
            return full_response
        except Exception as e:
            logger.error(f"Failed to stream response with LangChain: {e}", exc_info=True)
            fallback = "I apologize, but I'm having trouble processing that right now. Could you please rephrase your question?"
            yield fallback
            return fallback
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session ID
            
        Returns:
            List of conversation messages
        """
        return self.conversation_sessions.get(session_id, [])
    
    def clear_session(self, session_id: str):
        """
        Clear conversation history for a session.
        
        Args:
            session_id: Session ID
        """
        if session_id in self.conversation_sessions:
            del self.conversation_sessions[session_id]
            logger.info(f"Cleared conversation history for session {session_id}")


# Global instance
frontend_voice_bot_handler = FrontendVoiceBotHandler()
