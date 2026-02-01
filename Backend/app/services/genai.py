import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv

load_dotenv()

class GenAIService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("WARNING: GOOGLE_API_KEY not found in environment variables")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=api_key,
            convert_system_message_to_human=True
        )

    async def analyze_churn(self, customer_data: dict) -> dict:
        """
        Analyzes customer data to predict churn risk and provide reasoning.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert Customer Success AI. Analyze the provided customer data to assess churn risk. "
                       "Return a JSON object with keys: 'risk_score' (0-100), 'risk_level' (Low, Medium, High), "
                       "'reasoning' (list of strings), and 'recommended_actions' (list of strings)."),
            ("human", "Customer Data: {data}")
        ])

        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({"data": json.dumps(customer_data, default=str)})
            return result
        except Exception as e:
            print(f"Error in analyze_churn: {e}")
            return {
                "risk_score": 50, 
                "risk_level": "Unknown", 
                "reasoning": ["AI analysis failed"], 
                "recommended_actions": ["Manual review required"]
            }

    async def analyze_upsell(self, customer_data: dict) -> dict:
        """
        Identifies upsell opportunities based on usage and profile.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert Sales Engineer. Analyze the customer data for upsell opportunities. "
                       "Focus on feature usage saturation and license utilization. "
                       "Return a JSON object with keys: 'opportunity_score' (0-100), 'suggested_products' (list of strings), "
                       "and 'pitch_points' (list of strings)."),
            ("human", "Customer Data: {data}")
        ])

        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({"data": json.dumps(customer_data, default=str)})
            return result
        except Exception as e:
            print(f"Error in analyze_upsell: {e}")
            return {"opportunity_score": 0, "suggested_products": [], "pitch_points": []}

    async def generate_playbook(self, risk_factors: list) -> dict:
        """
        Generates a strategic action plan based on identified risk factors.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Strategy Consultant. Create a playbook to mitigate these risks. "
                       "Return a JSON object with keys: 'strategy_name', 'action_steps' (list of strings), "
                       "and 'expected_outcome'."),
            ("human", "Risk Factors: {risk_factors}")
        ])

        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({"risk_factors": json.dumps(risk_factors)})
            return result
        except Exception as e:
            print(f"Error in generate_playbook: {e}")
            return {"strategy_name": "Standard Mitigation", "action_steps": ["Schedule review"], "expected_outcome": "Unknown"}

    async def analyze_sentiment(self, interactions: list) -> dict:
        """
        Analyzes sentiment from customer interactions.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Sentiment Analyst. Analyze these interactions. "
                       "Return a JSON object with keys: 'overall_sentiment' (Positive/Neutral/Negative), "
                       "'sentiment_score' (-1.0 to 1.0), and 'key_themes' (list of strings)."),
            ("human", "Interactions: {interactions}")
        ])

        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = await chain.ainvoke({"interactions": json.dumps(interactions, default=str)})
            return result
        except Exception as e:
            print(f"Error in analyze_sentiment: {e}")
            return {"overall_sentiment": "Neutral", "sentiment_score": 0.0, "key_themes": []}

