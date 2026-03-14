"""
Voice conversation handler for customer calls using LangChain.
Handles different conversation flows based on usage percentage milestones.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)


def get_langchain_llm():
    """Initialize LangChain Azure OpenAI LLM for voice conversations."""
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
            max_tokens=200
        )
        
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LangChain LLM: {e}")
        return None


class VoiceConversationHandler:
    """Handles voice conversations with customers."""
    
    def __init__(self):
        """Initialize conversation handler."""
        self.conversation_history: Dict[str, List[Dict[str, str]]] = {}
    
    def get_conversation_script(
        self,
        account: Dict[str, Any],
        usage_percentage: float,
        call_type: str,
        purpose: Optional[str] = None,
    ) -> str:
        """
        Generate conversation script. Optional purpose: tailor script to this intent (e.g. manual trigger).
        """
        logger.info(f"Using reliable script for {account.get('name', 'Customer')} (usage: {usage_percentage:.1f}%)")
        return self._get_fallback_script(account, usage_percentage, purpose=purpose)
    
    def _get_fallback_script(
        self, account: Dict[str, Any], usage_percentage: float, purpose: Optional[str] = None
    ) -> str:
        """Reliable script generator. When purpose is set (e.g. manual trigger), tailor script to it."""
        account_name = account.get('name', 'Valued Customer')
        csm_name = account.get('csm_name', 'Jennifer')
        
        if not csm_name or csm_name.lower() in ['our team', 'team', '']:
            csm_name = 'Jennifer'
        if not account_name or account_name.lower() in ['valued customer', 'customer']:
            account_name = 'your account'
        
        if purpose and str(purpose).strip():
            script = (
                f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. "
                f"The reason for our call today is: {purpose.strip()}. "
                "I'd love to hear from you. Do you have a few minutes to talk?"
            )
            logger.info(f"Generated purpose-driven script for {account_name}: {script[:80]}...")
            script_lower = script.lower()
            unwanted = [
                "trial", "trial account", "upgrade", "execute", "press any key",
                "remove account", "click on", "remove this message"
            ]
            if any(phrase in script_lower for phrase in unwanted):
                script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. We wanted to follow up: {purpose.strip()}. Do you have a few minutes?"
            return script
        
        # Generate script based on usage percentage - keep it concise and natural
        if usage_percentage >= 95:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete and will be ending soon. We want to ensure a smooth transition and continue our partnership. Are you available to discuss renewal options today?"
        elif usage_percentage >= 90:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete and approaching its end date. We'd love to continue our partnership with you. Would you like to discuss renewal options?"
        elif usage_percentage >= 80:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. I wanted to check in and see how everything is going with our service. Are you experiencing any issues or challenges? Also, I wanted to mention that your contract renewal is coming up soon. Would you like to discuss renewal options?"
        elif usage_percentage >= 60:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. I'm checking in to see how things are going. Your contract is {usage_percentage:.0f}% complete. Are you experiencing any issues or challenges with our service that we can help address?"
        elif usage_percentage >= 40:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. I wanted to check in and see how everything is working for you. Are there any issues or concerns we should be aware of?"
        else:
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. I'm calling to check in and see how everything is going with our service. Are you experiencing any issues or do you have any questions?"
        
        # Clean script - remove any unwanted phrases - COMPREHENSIVE CHECK
        script_lower = script.lower()
        unwanted = [
            "trial", "trial account", "trial version", "have a trial",
            "upgrade", "upgrade to", "upgrade to full", "you can upgrade", "upgrade your",
            "execute", "execute code", "execute your code",
            "press key", "press any key", "press any", "any key",
            "click", "click on", "click number", "click on number",
            "remove account", "remove your account", "remove this message"
        ]
        if any(phrase in script_lower for phrase in unwanted):
            logger.error(f"CRITICAL: Unwanted phrase detected in fallback script! This should NEVER happen.")
            logger.error(f"Invalid script was: {script[:200]}...")
            # Return a safe, hardcoded default
            script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"
        
        logger.info(f"Generated script for {account_name}: {script[:100]}...")
        return script
    
    def generate_dynamic_response(
        self,
        account: Dict[str, Any],
        user_input: str,
        conversation_context: List[Dict[str, str]],
        usage_percentage: float,
        call_type: str
    ) -> str:
        """
        Generate dynamic response using LangChain based on user input.
        
        Args:
            account: Account information
            user_input: User's spoken input
            conversation_context: Previous conversation messages
            usage_percentage: Current usage percentage
            call_type: Type of call
            
        Returns:
            Response text
        """
        llm = get_langchain_llm()
        if not llm:
            # Fallback response
            return "I understand. Is there anything else I can help you with today?"
        
        try:
            account_name = account.get('name', 'Customer')
            csm_name = account.get('csm_name', 'our team')
            industry = account.get('industry', '')
            health_score = account.get('health_score') or 0
            
            # Build system prompt based on call type and usage percentage
            if usage_percentage >= 95:
                goal = "urgently discuss renewal options and ensure contract continuation"
            elif usage_percentage >= 90:
                goal = "discuss renewal options and secure contract continuation"
            elif usage_percentage >= 80:
                goal = "check for issues, address concerns, and introduce renewal discussion"
            else:
                goal = "check for issues and ensure customer satisfaction"
            
            # Build conversation history string
            conversation_history_str = ""
            if conversation_context:
                for msg in conversation_context[-3:]:  # Last 3 messages for context
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    conversation_history_str += f"{role.capitalize()}: {content}\n"
            
            # Create LangChain prompt template
            system_template = """You are a professional customer success representative named {csm_name} calling from Renewal & Upsell Advisor.

Account: {account_name}
Industry: {industry}
Health Score: {health_score}/100
Usage: {usage_percentage:.1f}% of contract completed
Call Goal: {goal}

Guidelines:
- Be friendly, professional, and empathetic
- Keep responses concise (10-20 seconds when spoken)
- Address customer concerns immediately
- If discussing renewal, be helpful but not pushy
- If customer mentions issues, offer solutions
- If the customer says they are busy or cannot talk right now, ALWAYS ask: "I completely understand. When would be a better time to call you back today or tomorrow?"
- Sound natural and conversational

Previous conversation:
{conversation_history}

Respond naturally to what the customer says."""
            
            human_template = """Customer said: {user_input}

Your response:"""
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template)
            ])
            
            # Create chain
            chain = prompt | llm | StrOutputParser()
            
            # Generate response
            response = chain.invoke({
                "csm_name": csm_name,
                "account_name": account_name,
                "industry": industry,
                "health_score": health_score,
                "usage_percentage": usage_percentage,
                "goal": goal,
                "conversation_history": conversation_history_str or "This is the start of the conversation.",
                "user_input": user_input
            })
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Failed to generate response with LangChain: {e}")
            # Fallback response
            return "I understand. Is there anything else I can help you with today?"
    
    def get_call_outcome(
        self,
        conversation_summary: str,
        usage_percentage: float
    ) -> str:
        """
        Determine call outcome based on conversation summary.
        
        Args:
            conversation_summary: Summary of the conversation
            usage_percentage: Current usage percentage
            
        Returns:
            Outcome category (interested, not_interested, callback_requested, voicemail, etc.)
        """
        summary_lower = conversation_summary.lower()
        
        # Check for keywords to determine outcome
        if 'voicemail' in summary_lower or 'no answer' in summary_lower:
            return 'voicemail'
        
        if 'callback' in summary_lower or 'call back' in summary_lower:
            return 'callback_requested'
        
        if usage_percentage >= 90:
            if any(word in summary_lower for word in ['yes', 'interested', 'renew', 'continue', 'agree']):
                return 'interested'
            elif any(word in summary_lower for word in ['no', 'not interested', 'decline', 'cancel']):
                return 'not_interested'
        
        if any(word in summary_lower for word in ['issue', 'problem', 'concern', 'help']):
            return 'needs_followup'
        
        return 'completed'

    def extract_callback_time(self, user_input: str, timezone_offset: str = "UTC") -> Optional[str]:
        """
        Extract a specific callback time from the user's spoken input.
        Returns an ISO-8601 UTC datetime string if a time is found, else None.
        """
        llm = get_langchain_llm()
        if not llm:
            return None
            
        try:
            now_iso = datetime.now().astimezone().isoformat()
            
            system_template = f"""You are a datetime extraction tool. 
Current time is {now_iso} (Timezone: {timezone_offset}).

If the user mentions a specific time to call back (e.g. "tomorrow at 3 PM", "in an hour", "next week Monday morning"), calculate that exact datetime in UTC and output ONLY the ISO-8601 string (e.g. 2026-03-15T15:00:00Z).
If the user DOES NOT mention a specific time or is too vague (e.g. "later", "busy right now"), output exactly: NONE.
Do not output any conversational text. ONLY output the ISO string or NONE."""

            human_template = "User input: {user_input}"
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template)
            ])
            
            chain = prompt | llm | StrOutputParser()
            result = chain.invoke({"user_input": user_input}).strip()
            
            if result == "NONE" or not result:
                return None
            return result
        except Exception as e:
            logger.error(f"Failed to extract callback time: {e}")
            return None

# Global instance
voice_conversation_handler = VoiceConversationHandler()
