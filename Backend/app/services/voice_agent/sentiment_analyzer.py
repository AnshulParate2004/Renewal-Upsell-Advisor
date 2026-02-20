"""
Sentiment analysis for voice call transcripts using LangChain.
"""
from typing import Dict, Any, Optional
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json
import re
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)


def get_langchain_llm():
    """Initialize LangChain Azure OpenAI LLM for sentiment analysis."""
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
            temperature=0.3,
            max_tokens=200
        )
        
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LangChain LLM: {e}")
        return None


class SentimentAnalyzer:
    """Analyzes sentiment from call transcripts."""
    
    def analyze_sentiment(self, transcript: str) -> Dict[str, Any]:
        """
        Analyze sentiment from call transcript.
        
        Args:
            transcript: Call transcript text
            
        Returns:
            Dictionary with sentiment_score, sentiment_category, and keywords
        """
        if not transcript or len(transcript.strip()) < 10:
            # Default neutral sentiment for very short transcripts
            return {
                'sentiment_score': 0.0,
                'sentiment_category': 'neutral',
                'keywords': []
            }
        
        try:
            # Use LangChain to analyze sentiment
            llm = get_langchain_llm()
            if not llm:
                # Fallback to neutral sentiment
                return {
                    'sentiment_score': 0.0,
                    'sentiment_category': 'neutral',
                    'keywords': []
                }
            
            # Create LangChain prompt template
            system_template = """You are a sentiment analysis expert. Analyze the conversation transcript and provide:
1. Sentiment score: A number between -1.0 (very negative) and 1.0 (very positive)
2. Sentiment category: one of: very_negative, negative, neutral, positive, very_positive
3. Keywords: List of 3-5 key emotional words or phrases from the conversation

Respond ONLY in valid JSON format:
{{
    "sentiment_score": 0.5,
    "sentiment_category": "positive",
    "keywords": ["satisfied", "helpful", "good service"]
}}"""
            
            human_template = """Analyze the sentiment of this conversation transcript:

{transcript}

Provide sentiment analysis in JSON format."""
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template)
            ])
            
            # Create chain
            chain = prompt | llm | StrOutputParser()
            
            # Generate analysis
            response = chain.invoke({
                "transcript": transcript
            })
            
            # Parse JSON response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                except json.JSONDecodeError:
                    result = self._parse_sentiment_fallback(response)
            else:
                try:
                    result = json.loads(response)
                except json.JSONDecodeError:
                    result = self._parse_sentiment_fallback(response)
            
            # Validate and normalize sentiment score
            sentiment_score = float(result.get('sentiment_score', 0.0))
            sentiment_score = max(-1.0, min(1.0, sentiment_score))  # Clamp to -1 to 1
            
            # Validate sentiment category
            category = result.get('sentiment_category', 'neutral')
            valid_categories = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
            if category not in valid_categories:
                # Map score to category if invalid
                if sentiment_score <= -0.6:
                    category = 'very_negative'
                elif sentiment_score <= -0.2:
                    category = 'negative'
                elif sentiment_score <= 0.2:
                    category = 'neutral'
                elif sentiment_score <= 0.6:
                    category = 'positive'
                else:
                    category = 'very_positive'
            
            keywords = result.get('keywords', [])
            if not isinstance(keywords, list):
                keywords = []
            
            return {
                'sentiment_score': sentiment_score,
                'sentiment_category': category,
                'keywords': keywords[:5]  # Limit to 5 keywords
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze sentiment: {e}")
            # Return neutral sentiment on error
            return {
                'sentiment_score': 0.0,
                'sentiment_category': 'neutral',
                'keywords': []
            }
    
    def _parse_sentiment_fallback(self, text: str) -> Dict[str, Any]:
        """Fallback parser if JSON parsing fails."""
        import re
        
        # Try to extract sentiment score
        score_match = re.search(r'sentiment[_\s]*score["\']?\s*[:=]\s*([-]?\d+\.?\d*)', text, re.IGNORECASE)
        score = float(score_match.group(1)) if score_match else 0.0
        
        # Try to extract category
        category_match = re.search(r'sentiment[_\s]*category["\']?\s*[:=]\s*["\']?(\w+)', text, re.IGNORECASE)
        category = category_match.group(1) if category_match else 'neutral'
        
        # Try to extract keywords
        keywords_match = re.search(r'keywords["\']?\s*[:=]\s*\[(.*?)\]', text, re.IGNORECASE | re.DOTALL)
        keywords = []
        if keywords_match:
            keywords_str = keywords_match.group(1)
            keywords = [k.strip().strip('"\'') for k in keywords_str.split(',')]
        
        return {
            'sentiment_score': max(-1.0, min(1.0, score)),
            'sentiment_category': category,
            'keywords': keywords[:5]
        }
    
    def update_account_sentiment(
        self,
        account_id: str,
        sentiment_data: Dict[str, Any],
        source: str = 'voice_calls'
    ) -> bool:
        """
        Update account sentiment in database.
        This should be called after storing sentiment_analysis record.
        
        Args:
            account_id: Account ID
            sentiment_data: Sentiment analysis results
            source: Source of sentiment (voice_calls, emails, etc.)
            
        Returns:
            True if successful
        """
        # This will be handled by the scheduler when storing sentiment_analysis
        # Just return True for now
        return True


# Global instance
sentiment_analyzer = SentimentAnalyzer()
