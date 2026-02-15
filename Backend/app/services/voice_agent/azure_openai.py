"""
Azure OpenAI Service for conversational AI.
"""
from typing import Optional, List, Dict, Any
from openai import AzureOpenAI
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AzureOpenAIService:
    """Service for Azure OpenAI API interactions."""
    
    def __init__(self):
        """Initialize Azure OpenAI service."""
        if not all([
            settings.AZURE_OPENAI_API_KEY,
            settings.AZURE_OPENAI_ENDPOINT,
            settings.AZURE_OPENAI_DEPLOYMENT
        ]):
            logger.warning("Azure OpenAI credentials not configured")
            self.client = None
        else:
            self.client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.deployment = settings.AZURE_OPENAI_DEPLOYMENT
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate chat completion using Azure OpenAI.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        if not self.client:
            raise ValueError("Azure OpenAI not configured")
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Azure OpenAI chat completion failed: {e}")
            raise
    
    def generate_voice_script(
        self,
        account_name: str,
        context: str,
        goal: str = "renewal"
    ) -> str:
        """
        Generate a voice call script for account outreach.
        
        Args:
            account_name: Account name
            context: Account context (health score, risk, etc.)
            goal: Call goal (renewal, upsell, etc.)
            
        Returns:
            Generated script text
        """
        system_prompt = """You are a professional customer success representative.
Generate a natural, conversational script for a voice call. Keep it concise (30-60 seconds).
Be friendly, professional, and focused on the customer's needs."""
        
        user_prompt = f"""Generate a voice call script for:
Account: {account_name}
Context: {context}
Goal: {goal}

Script:"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return self.chat_completion(messages, temperature=0.8, max_tokens=200)


# Global instance
azure_openai = AzureOpenAIService()
