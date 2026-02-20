"""
LLM-powered email personalization service using LangChain.
Uses Azure OpenAI via LangChain to generate personalized email content for customers.
"""
from typing import Dict, Any, Optional
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)


def get_langchain_llm():
    """Initialize LangChain Azure OpenAI LLM."""
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
            temperature=0.5,
            max_tokens=300
        )
        
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize LangChain LLM: {e}")
        return None


def personalize_email_content(
    account: Dict[str, Any],
    email_type: str,
    base_subject: str,
    base_html_body: str,
    base_text_body: str,
    opportunity: Optional[Dict[str, Any]] = None
) -> tuple[str, str, str]:
    """
    Personalize email content using LangChain and Azure OpenAI based on account data.
    
    Args:
        account: Account data dictionary
        email_type: Type of email (renewal_reminder, upsell, churn_prevention, wellness_check)
        base_subject: Base email subject
        base_html_body: Base HTML email body
        base_text_body: Base text email body
        opportunity: Optional opportunity data for upsell emails
        
    Returns:
        Tuple of (personalized_subject, personalized_html_body, personalized_text_body)
    """
    # Initialize LangChain LLM
    llm = get_langchain_llm()
    if not llm:
        logger.warning("LangChain LLM not configured. Using base templates without personalization.")
        return base_subject, base_html_body, base_text_body
    
    try:
        # Prepare account context for LLM
        account_name = account.get("name", "Valued Customer")
        industry = account.get("industry", "")
        company_size = account.get("company_size", "")
        health_score = account.get("health_score") or 0
        risk_score = account.get("risk_score") or 0
        relationship_score = account.get("relationship_score") or 0
        churn_probability = account.get("churn_probability") or 0
        sentiment_category = account.get("sentiment_category", "neutral")
        arr = account.get("arr") or 0
        mrr = account.get("mrr") or 0
        renewal_date = account.get("renewal_date", "")
        utilization_percentage = account.get("utilization_percentage") or 0
        csm_name = account.get("csm_name", "Your Customer Success Manager")
        csm_email = account.get("csm_email", "")
        
        # Build context string
        context = f"""
Account Information:
- Company: {account_name}
- Industry: {industry}
- Company Size: {company_size}
- Annual Recurring Revenue (ARR): ${arr:,.2f}
- Monthly Recurring Revenue (MRR): ${mrr:,.2f}
- Health Score: {health_score}/100
- Risk Score: {risk_score}/100
- Relationship Score: {relationship_score}/100
- Churn Probability: {churn_probability:.2%}
- Sentiment: {sentiment_category}
- License Utilization: {utilization_percentage}%
- Renewal Date: {renewal_date}
- Customer Success Manager: {csm_name} ({csm_email})
"""
        
        if opportunity:
            opportunity_type = opportunity.get("type", "upsell")
            opportunity_value = opportunity.get("value", 0)
            opportunity_probability = opportunity.get("probability", 0)
            context += f"""
Opportunity Details:
- Type: {opportunity_type}
- Potential Value: ${opportunity_value:,.2f}
- Probability: {opportunity_probability:.2%}
"""
        
        # Create LangChain prompts based on email type
        if email_type == "renewal_reminder":
            system_template = """You are a professional customer success manager writing a renewal reminder email.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and format as the base template
4. Use ONLY the account data provided - do not invent information
5. Keep CSM names and emails exactly as provided in the account data

Your goal is to:
1. Personalize the subject line (keep it concise, under 60 characters)
2. Enhance a few key phrases in the email body to make it more personal
3. Keep the same professional structure and formatting
4. Reference their industry or company size naturally if mentioned

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [2-3 sentences that can replace generic phrases in the email]
- Do NOT return full email body"""
            
            human_template = """Personalize ONLY the subject line and provide 2-3 enhancement sentences for this renewal reminder email:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Return format:
Subject: [your personalized subject]
Enhancement: [2-3 sentences to personalize the greeting/opening paragraph]"""
        
        elif email_type == "upsell":
            system_template = """You are a professional sales representative writing an upsell opportunity email.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and format as the base template
4. Use ONLY the account data provided - do not invent information
5. Keep CSM names and emails exactly as provided in the account data

Your goal is to:
1. Personalize the subject line (compelling, under 60 characters)
2. Enhance a few key phrases to highlight value
3. Keep the same professional structure

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [2-3 sentences to personalize the value proposition]"""
            
            human_template = """Personalize ONLY the subject line and provide 2-3 enhancement sentences for this upsell email:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Return format:
Subject: [your personalized subject]
Enhancement: [2-3 sentences about value/opportunity]"""
        
        elif email_type == "churn_prevention":
            system_template = """You are a customer success manager writing a churn prevention email.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and format as the base template
4. Use ONLY the account data provided - do not invent information
5. Keep CSM names and emails exactly as provided in the account data

Your goal is to:
1. Personalize the subject line (caring and engaging, under 60 characters)
2. Enhance a few key phrases to show empathy
3. Keep the same professional structure

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [2-3 empathetic sentences for opening]"""
            
            human_template = """Personalize ONLY the subject line and provide 2-3 enhancement sentences for this churn prevention email:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Return format:
Subject: [your personalized subject]
Enhancement: [2-3 empathetic, caring sentences]"""
        
        elif email_type == "wellness_check":
            system_template = """You are a friendly customer success manager writing a wellness check-in email.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and format as the base template
4. Use ONLY the account data provided - do not invent information
5. Keep CSM names and emails exactly as provided in the account data

Your goal is to:
1. Personalize the subject line (friendly and casual, under 60 characters)
2. Enhance a few key phrases to make it more personal
3. Keep the same professional structure
4. This is NOT about renewal - just checking in

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [2-3 sentences for friendly check-in opening]"""
            
            human_template = """Personalize ONLY the subject line and provide 2-3 enhancement sentences for this wellness check-in email:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Return format:
Subject: [your personalized subject]
Enhancement: [2-3 friendly check-in sentences]"""
        
        else:
            # Default personalization
            system_template = """You are a professional customer success manager writing personalized emails.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and format as the base template
4. Use ONLY the account data provided - do not invent information

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [2-3 personalized sentences]"""
            
            human_template = """Personalize ONLY the subject line and provide 2-3 enhancement sentences:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Return format:
Subject: [your personalized subject]
Enhancement: [2-3 personalized sentences]"""
        
        # Create LangChain prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_template),
            ("human", human_template)
        ])
        
        # Create chain: prompt -> LLM -> parser
        chain = prompt | llm | StrOutputParser()
        
        # Invoke chain with context
        base_text_preview = base_text_body[:200] + "..." if len(base_text_body) > 200 else base_text_body
        
        personalized_content = chain.invoke({
            "context": context,
            "base_subject": base_subject,
            "base_text_body_preview": base_text_preview,
            "csm_name": csm_name,
            "csm_email": csm_email if csm_email else "N/A"
        })
        
        # Parse the response - extract subject and enhancement only
        lines = personalized_content.split('\n')
        
        personalized_subject = base_subject
        enhancement_text = ""
        
        # Extract subject and enhancement
        current_section = None
        subject_lines = []
        enhancement_lines = []
        
        for line in lines:
            line_lower = line.lower().strip()
            if 'subject:' in line_lower:
                current_section = 'subject'
                subject_text = line.split(':', 1)[-1].strip()
                if subject_text:
                    subject_lines.append(subject_text)
            elif 'enhancement:' in line_lower:
                current_section = 'enhancement'
                enhancement_text = line.split(':', 1)[-1].strip()
            else:
                if current_section == 'subject':
                    subject_lines.append(line.strip())
                elif current_section == 'enhancement':
                    enhancement_lines.append(line.strip())
        
        # Extract subject
        if subject_lines:
            personalized_subject = ' '.join(subject_lines).strip()
            personalized_subject = personalized_subject.strip('"\'')
            if len(personalized_subject) > 100:
                personalized_subject = personalized_subject[:97] + "..."
        
        # Extract enhancement
        if enhancement_lines:
            enhancement_text = ' '.join(enhancement_lines).strip()
        
        # Use base templates but enhance with LLM personalization
        # Replace generic greeting with personalized enhancement if available
        personalized_html = base_html_body
        personalized_text = base_text_body
        
        if enhancement_text and len(enhancement_text) > 20:
            # Replace generic opening in HTML
            generic_greeting = f"<p>Dear {account_name} Team,</p>"
            if generic_greeting in personalized_html:
                # Add enhancement after greeting
                enhanced_greeting = f"{generic_greeting}\n            <p>{enhancement_text}</p>"
                personalized_html = personalized_html.replace(generic_greeting, enhanced_greeting, 1)
            
            # Replace generic opening in text
            generic_text_greeting = f"Dear {account_name} Team,"
            if generic_text_greeting in personalized_text:
                enhanced_text_greeting = f"{generic_text_greeting}\n\n{enhancement_text}"
                personalized_text = personalized_text.replace(generic_text_greeting, enhanced_text_greeting, 1)
        
        logger.info(f"Personalized email for {account_name} (type: {email_type}) using LangChain")
        
        return personalized_subject, personalized_html, personalized_text
        
    except Exception as e:
        logger.error(f"Failed to personalize email with LangChain: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Fallback to base templates
        return base_subject, base_html_body, base_text_body
