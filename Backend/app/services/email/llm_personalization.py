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
    opportunity: Optional[Dict[str, Any]] = None,
    user_purpose: Optional[str] = None,
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
        mrr_raw = account.get("monthly_wise_instalment") or account.get("mrr")
        if mrr_raw is not None and mrr_raw != "":
            try:
                mrr = float(mrr_raw)
            except (TypeError, ValueError):
                mrr = (arr / 12) if arr else 0
        else:
            mrr = (arr / 12) if arr else 0
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
        if user_purpose and str(user_purpose).strip():
            context += f"""
User's stated purpose for this message (tailor subject and body to this intent):
"{user_purpose.strip()}"

IMPORTANT: Generate subject and enhancement that match the above purpose.
"""
        
        # When user gave a custom purpose (e.g. "10% discount"), generate full email from that prompt only
        if user_purpose and str(user_purpose).strip():
            system_custom = """You are a professional writing a short customer email. Use ONLY the account data provided for names/emails. CRITICAL: Use the user's purpose EXACTLY — do not change any numbers (e.g. if they say 10% you must write 10%, not 15% or 20%), percentages, timeframes, or key terms. Return only Subject and Body in the exact format below."""
            human_custom = '''Generate an email that fulfills EXACTLY this purpose (use the same numbers and terms — do not substitute different percentages or amounts): "{purpose}"

Account context:
{context}

Use CSM name and email from context. Return ONLY in this format:
Subject: [one line subject, under 60 chars; must reflect the purpose exactly, e.g. "10% discount" not "15% discount"]
Body: [2-5 sentences; must use the exact numbers/terms from the purpose above]'''
            prompt_custom = ChatPromptTemplate.from_messages([
                ("system", system_custom),
                ("human", human_custom)
            ])
            chain_custom = prompt_custom | llm | StrOutputParser()
            try:
                out = chain_custom.invoke({
                    "purpose": user_purpose.strip(),
                    "context": context,
                })
                lines = out.split("\n")
                subj, body_text = "", ""
                current = None
                for line in lines:
                    low = line.strip().lower()
                    if low.startswith("subject:"):
                        current = "subject"
                        subj = line.split(":", 1)[-1].strip().strip('"\'')
                    elif low.startswith("body:"):
                        current = "body"
                        body_text = line.split(":", 1)[-1].strip()
                    elif current == "subject" and subj and not subj.endswith("..."):
                        subj = (subj + " " + line.strip()).strip()[:100]
                    elif current == "body":
                        body_text = (body_text + " " + line.strip()).strip()
                if subj:
                    personalized_subject = subj[:97] + "..." if len(subj) > 100 else subj
                else:
                    personalized_subject = base_subject
                if body_text and len(body_text) > 10:
                    body_escaped = body_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    mailto = f'mailto:{csm_email}' if csm_email else '#'
                    csm_link = f'<a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''
                    personalized_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #fff; }}
.header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 28px 24px; text-align: center; border-radius: 10px 10px 0 0; }}
.header h1 {{ margin: 0; font-size: 22px; font-weight: 600; }}
.content {{ background: #ffffff; padding: 30px 24px; border-radius: 0 0 10px 10px; }}
.content p {{ margin: 0 0 16px 0; text-align: left; }}
.highlight {{ background: #d4edda; padding: 16px 20px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 4px; }}
.highlight p {{ margin: 0; font-size: 15px; }}
.button-wrap {{ text-align: center; margin: 24px 0; }}
.button {{ display: inline-block; padding: 14px 32px; background: #f5576c; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }}
.csm-block {{ margin-top: 24px; }}
.csm-block a {{ color: #0066cc; text-decoration: underline; }}
.footer {{ margin-top: 28px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
</style>
</head>
<body>
<div class="header"><h1>Quick follow-up</h1></div>
<div class="content">
<p>Hi {account_name} team,</p>
<p>{body_escaped}</p>
<div class="highlight"><p>We'd love to hear from you — just reply to this email or reach out to your CSM below.</p></div>
<div class="button-wrap"><a href="{mailto}" class="button">Reply or contact your CSM</a></div>
<p class="csm-block">Your Customer Success Manager:<br><strong>{csm_name}</strong><br>{csm_link}</p>
<p>Best regards,<br>Renewal &amp; Upsell Advisor Team</p>
</div>
<div class="footer"><p>This is an automated email. Please do not reply directly to this message.</p></div>
</body>
</html>"""
                    personalized_text = f"""Hi {account_name} team,

{body_text}

Your Customer Success Manager: {csm_name}
{f'Email: {csm_email}' if csm_email else ''}

Best regards,
Renewal & Upsell Advisor Team"""
                    logger.info(f"Generated email from purpose for {account_name}")
                    return personalized_subject, personalized_html, personalized_text
            except Exception as e:
                logger.warning(f"Purpose-only generation failed: {e}, falling back to template enhancement")
        
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
            system_template = """You are a friendly customer success contact writing a short follow-up email.
IMPORTANT RULES:
1. DO NOT create fake names, email addresses, or contact information
2. DO NOT replace the entire email - only enhance specific phrases
3. Keep the same structure and tone: conversational, asking how the review went
4. Use ONLY the account data provided - do not invent information
5. Keep CSM names and emails exactly as provided in the account data

Your goal is to:
1. Personalize the subject line (conversational, under 60 characters)
2. Add 1-2 short sentences that feel natural — e.g. reference their review, ask for feedback, or offer to chat
3. Keep the tone warm and human, not salesy. Focus on "how was the review" and "we'd love to hear from you".

Return ONLY:
- Subject: [personalized subject line]
- Enhancement: [1-2 sentences to personalize the review follow-up]"""
            
            human_template = """Personalize ONLY the subject line and provide 1-2 enhancement sentences for this review follow-up email:

Account Context:
{context}

Base Email Subject: {base_subject}
Base Email Body Preview: {base_text_body_preview}...

CRITICAL: 
- Use the CSM name from account data: {csm_name}
- Use the CSM email from account data: {csm_email}
- DO NOT create fake names or emails
- Tone: ask how the review went, invite feedback, offer support. Do NOT mention "Potential Value", "Confidence Level", or "Recommended Products".
- Return format:
Subject: [your personalized subject]
Enhancement: [1-2 sentences for a natural review follow-up]"""
        
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
            # Replace generic opening in HTML (support "Hi ... team" or "Dear ... Team")
            for html_greeting in [f"<p>Hi {account_name} team,</p>", f"<p>Dear {account_name} Team,</p>"]:
                if html_greeting in personalized_html:
                    enhanced_greeting = f"{html_greeting}\n            <p>{enhancement_text}</p>"
                    personalized_html = personalized_html.replace(html_greeting, enhanced_greeting, 1)
                    break
            # Replace generic opening in text
            for text_greeting in [f"Hi {account_name} team,", f"Dear {account_name} Team,"]:
                if text_greeting in personalized_text:
                    enhanced_text_greeting = f"{text_greeting}\n\n{enhancement_text}"
                    personalized_text = personalized_text.replace(text_greeting, enhanced_text_greeting, 1)
                    break
        
        logger.info(f"Personalized email for {account_name} (type: {email_type}) using LangChain")
        
        return personalized_subject, personalized_html, personalized_text
        
    except Exception as e:
        logger.error(f"Failed to personalize email with LangChain: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Fallback to base templates
        return base_subject, base_html_body, base_text_body
