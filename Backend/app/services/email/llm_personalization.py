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
        account_name = str(account.get("name", "Valued Customer")).strip()
        industry = account.get("industry", "")
        sentiment_category = account.get("sentiment_category") or "neutral"
        renewal_date = account.get("renewal_date") or ""
        csm_name = account.get("csm_name") or "Your Customer Success Manager"
        csm_email = account.get("csm_email", "")
        
        # ⚠️ We deliberately do NOT pass any financial figures (ARR, MRR, scores, percentages)
        # to the LLM context. We want emails to sound like a human CSM, not a data report.
        context = f"""
Account Information:
- Company: {account_name}
- Industry: {industry}
- Customer Sentiment: {sentiment_category}
- Renewal Date: {renewal_date}
- CSM Name: {csm_name}
"""
        
        if opportunity:
            opportunity_type = opportunity.get("type", "upsell")
            context += f"""
Opportunity Details:
- Type: {opportunity_type}
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
            system_template = """You are a warm, human Customer Success Manager (CSM) writing a short renewal reminder.
RULES (follow strictly):
1. Write naturally, like a person texting a colleague — not a formal letter.
2. NEVER mention any numbers, dollar amounts, percentages, scores, ARR, MRR, or any financial metrics. Not even rounded ones.
3. DO NOT start with a greeting like "Dear..." or "Hi..." — the template already has a greeting.
4. Keep the enhancement to 1-2 sentences only.
5. Use only the account info provided. Do not invent anything.

Return ONLY:
Subject: [short, friendly subject under 60 chars]
Enhancement: [1-2 natural sentences to add after the greeting]"""

            human_template = """Write a brief enhancement for this renewal reminder:

Account: {context}
Base subject: {base_subject}

Format:
Subject: [your subject]
Enhancement: [1-2 sentences, no numbers, no financial figures]"""
        
        elif email_type == "upsell":
            system_template = """You are a friendly Customer Success Manager writing a brief follow-up.
RULES (follow strictly):
1. Be casual and human. No business-speak.
2. NEVER mention any numbers, dollar amounts, percentages, scores, ARR, MRR, or financial metrics.
3. DO NOT add a greeting — the template already has one.
4. Keep it to 1-2 sentences.
5. Ask how things are going or invite them to share feedback.

Return ONLY:
Subject: [short friendly subject under 60 chars]
Enhancement: [1-2 sentences]"""

            human_template = """Write a brief enhancement for this follow-up email:

Account: {context}
Base subject: {base_subject}

Format:
Subject: [your subject]
Enhancement: [1-2 sentences, no numbers]"""
        
        elif email_type == "churn_prevention":
            system_template = """You are a caring Customer Success Manager writing a check-in email.
RULES (follow strictly):
1. Be warm, empathetic, and human.
2. NEVER mention any numbers, dollar amounts, percentages, scores, ARR, MRR, or financial metrics.
3. DO NOT add a greeting — the template already has one.
4. Keep it to 2-3 sentences.
5. Focus on caring and understanding, not selling.

Return ONLY:
Subject: [empathetic subject under 60 chars]
Enhancement: [2-3 caring sentences]"""

            human_template = """Write a brief enhancement for this churn prevention email:

Account: {context}
Base subject: {base_subject}

Format:
Subject: [your subject]
Enhancement: [2-3 sentences, no numbers]"""

        elif email_type == "wellness_check":
            system_template = """You are a friendly Customer Success Manager doing a casual check-in.
RULES (follow strictly):
1. Be warm and conversational, like checking in on a friend.
2. NEVER mention any numbers, dollar amounts, percentages, scores, ARR, MRR, or financial metrics.
3. DO NOT add a greeting — the template already has one.
4. Keep it to 1-2 sentences.
5. This is NOT about renewal or sales — just being friendly.

Return ONLY:
Subject: [casual friendly subject under 60 chars]
Enhancement: [1-2 casual sentences]"""

            human_template = """Write a brief enhancement for this wellness check-in:

Account: {context}
Base subject: {base_subject}

Format:
Subject: [your subject]
Enhancement: [1-2 sentences, no numbers, no financial figures]"""
        
        else:
            system_template = """You are a professional Customer Success Manager writing a short personalized email.
RULES (follow strictly):
1. Be warm, human, and concise.
2. NEVER mention any numbers, dollar amounts, percentages, scores, ARR, MRR, or financial metrics.
3. DO NOT add a greeting — the template already has one.
4. Keep it to 2-3 sentences.

Return ONLY:
Subject: [personalized subject under 60 chars]
Enhancement: [2-3 personalized sentences]"""

            human_template = """Write a brief personalized enhancement:

Account: {context}
Base subject: {base_subject}

Format:
Subject: [your subject]
Enhancement: [2-3 sentences, no numbers]"""
        
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
        personalized_html = base_html_body
        personalized_text = base_text_body
        
        if enhancement_text and len(enhancement_text) > 10:
            # 💡 To avoid double greetings ("Hi Team, Dear Team"), we look for greetings in the enhancement.
            # We strip any typical greetings if they are already present in the enhancement.
            enh_lower = enhancement_text.lower().strip()
            greetings = ["hi ", "hello ", "dear ", "hey ", "hi,"]
            has_greeting = any(enh_lower.startswith(g) for g in greetings)
            
            # If the enhancement starts with a greeting, we'll replace the base greeting entirely.
            # If it doesn't, we'll append it gracefully.
            
            # Replace generic opening in HTML
            account_name_clean = str(account_name).strip()
            for html_greeting in [f"Hi {account_name_clean} team,", f"Dear {account_name_clean} Team,"]:
                html_snippet = f"<p>{html_greeting}</p>"
                if html_snippet in personalized_html or html_greeting in personalized_html:
                    if has_greeting:
                        # Full replacement to avoid double greeting
                        if html_snippet in personalized_html:
                            personalized_html = personalized_html.replace(html_snippet, f"<p>{enhancement_text}</p>", 1)
                        else:
                            personalized_html = personalized_html.replace(html_greeting, enhancement_text, 1)
                    else:
                        # Append gracefully
                        if html_snippet in personalized_html:
                            enhanced_greeting = f"{html_snippet}\n            <p>{enhancement_text}</p>"
                            personalized_html = personalized_html.replace(html_snippet, enhanced_greeting, 1)
                        else:
                            personalized_html = personalized_html.replace(html_greeting, f"{html_greeting}\n{enhancement_text}", 1)
                    break
            
            # Replace generic opening in text
            for text_greeting in [f"Hi {account_name_clean} team,", f"Dear {account_name_clean} Team,"]:
                if text_greeting in personalized_text:
                    if has_greeting:
                        # Full replacement
                        personalized_text = personalized_text.replace(text_greeting, enhancement_text, 1)
                    else:
                        # Append
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
