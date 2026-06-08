"""
Email templates for renewal and upsell campaigns.
"""
from typing import Dict, Any
from datetime import datetime


def get_renewal_reminder_template(account: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate renewal reminder email template.
    Tone: Short, conversational, directly asking about the renewal without unnecessary stats.
    """
    account_name = str(account.get("name", "Valued Customer")).strip()
    renewal_date = account.get("renewal_date")
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    # Format renewal date
    if renewal_date:
        try:
            if isinstance(renewal_date, str):
                renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
            else:
                renewal_dt = renewal_date
            renewal_date_str = " on " + renewal_dt.strftime("%B %d")
        except:
            renewal_date_str = ""
    else:
        renewal_date_str = " soon"
        
    subject = f"Checking in on your upcoming renewal — {account_name}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
            }}
            .csm-block {{
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #eee;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 11px;
                color: #999;
            }}
        </style>
    </head>
    <body>
        <p>Hi {account_name} team,</p>
        
        <p>I hope you're having a great week.</p>
        
        <p>I'm reaching out because your subscription is coming up for renewal{renewal_date_str}. We've really enjoyed partnering with you, and I want to make sure the transition to your next term is as smooth as possible.</p>
        
        <p>Do you have a few minutes next week for a quick sync? I'd love to hear how things are going and answer any questions you might have.</p>
        
        <p>Looking forward to hearing from you!</p>
        
        <div class="csm-block">
            <p>Best,<br>
            <strong>{csm_name}</strong><br>
            {f'<a href="mailto:{csm_email}" style="color: #666; text-decoration: none;">{csm_email}</a>' if csm_email else ''}
            </p>
        </div>
        
        <div class="footer">
            <p>Sent via Renewal & Upsell Advisor. Reply directly to this email to reach your CSM.</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
Hi {account_name} team,

I hope you're having a great week.

I'm reaching out because your subscription is coming up for renewal{renewal_date_str}. We've really enjoyed partnering with you, and I want to make sure the transition to your next term is as smooth as possible.

Do you have a few minutes next week for a quick sync? I'd love to hear how things are going and answer any questions you might have.

Looking forward to hearing from you!

Best,
{csm_name}
{f'{csm_email}' if csm_email else ''}

---
Sent via Renewal & Upsell Advisor. Reply directly to this email to reach your CSM.
    """
    
    return subject, html_body, text_body


def get_upsell_opportunity_template(account: Dict[str, Any], opportunity: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate upsell opportunity email template.
    Tone: conversational, review-focused — ask how the review went and invite feedback.
    """
    account_name = str(account.get("name", "Valued Customer")).strip()
    csm_name = account.get("csm_name") or account.get("csm") or "Your Customer Success Manager"
    csm_email = account.get("csm_email", "")

    subject = f"Quick follow-up — how was your review? ({account_name})"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 0;
                background: #fff;
            }}
            .header {{
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 28px 24px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .header h1 {{
                margin: 0;
                font-size: 22px;
                font-weight: 600;
            }}
            .content {{
                background: #ffffff;
                padding: 30px 24px;
                border-radius: 0 0 10px 10px;
            }}
            .content p {{
                margin: 0 0 16px 0;
                text-align: left;
            }}
            .highlight {{
                background: #d4edda;
                padding: 16px 20px;
                border-left: 4px solid #28a745;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .highlight p {{
                margin: 0;
                font-size: 15px;
            }}
            .button-wrap {{
                text-align: center;
                margin: 24px 0;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background: #f5576c;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 15px;
            }}
            .csm-block {{
                margin-top: 24px;
            }}
            .csm-block a {{
                color: #0066cc;
                text-decoration: underline;
            }}
            .footer {{
                margin-top: 28px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Quick follow-up</h1>
        </div>
        <div class="content">
            <p>Hi {account_name} team,</p>

            <p>Hope you're doing well. We wanted to follow up and ask: <strong>how did your recent review go?</strong> We'd love to hear your feedback — what went well, and if there's anything we could do better or any way we can support you going forward.</p>

            <div class="highlight">
                <p>We'd love to hear from you — just reply to this email or reach out to your CSM below.</p>
            </div>

            <div class="button-wrap">
                <a href="{f'mailto:{csm_email}' if csm_email else '#'}" class="button">Reply or contact your CSM</a>
            </div>

            <p class="csm-block">Your Customer Success Manager:<br>
            <strong>{csm_name}</strong><br>
            {f'<a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>

            <p>Best regards,<br>
            Renewal & Upsell Advisor Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </body>
    </html>
    """

    text_body = f"""
Quick follow-up — how was your review? ({account_name})

Hi {account_name} team,

Hope you're doing well. We wanted to follow up and ask: how did your recent review go? We'd love to hear your feedback — what went well, and if there's anything we could do better or any way we can support you going forward.

If you have a few minutes, just reply to this email or reach out to your CSM below. We're here to help.

Your Customer Success Manager:
{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

Best regards,
Renewal & Upsell Advisor Team

---
This is an automated email. Please do not reply directly to this message.
    """

    return subject, html_body, text_body


def get_churn_prevention_template(account: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate churn prevention email template.
    
    Args:
        account: Account data dictionary
        
    Returns:
        Tuple of (subject, html_body, text_body)
    """
    account_name = str(account.get("name", "Valued Customer")).strip()
    risk_score = account.get("risk_score", 0)
    health_score = account.get("health_score", 0)
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    subject = f"Let's Discuss Your Success: {account_name}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .highlight {{
                background: #fff3cd;
                padding: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #fa709a;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Let's Discuss Your Success</h1>
        </div>
        <div class="content">
            <p>Dear {account_name} Team,</p>
            
            <p>We wanted to reach out personally to ensure you're getting the most value from our platform. Your success is our top priority, and we'd love to understand how we can better support your goals.</p>
            
            <div class="highlight">
                <p><strong>We're here to help!</strong> Let's schedule a quick call to discuss:</p>
                <ul>
                    <li>How you're currently using the platform</li>
                    <li>Any challenges or concerns you may have</li>
                    <li>Ways we can help you achieve better results</li>
                </ul>
            </div>
            
            <p style="text-align: center;">
                <a href="#" class="button">Schedule a Call</a>
            </p>
            
            <p>Your dedicated Customer Success Manager is ready to assist:</p>
            
            <p>
                <strong>{csm_name}</strong><br>
                {f'Email: <a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>
            
            <p>We value your partnership and look forward to hearing from you!</p>
            
            <p>Best regards,<br>
            Renewal & Upsell Advisor Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
Let's Discuss Your Success: {account_name}

Dear {account_name} Team,

We wanted to reach out personally to ensure you're getting the most value from our platform. Your success is our top priority, and we'd love to understand how we can better support your goals.

We're here to help! Let's schedule a quick call to discuss:
- How you're currently using the platform
- Any challenges or concerns you may have
- Ways we can help you achieve better results

Your dedicated Customer Success Manager is ready to assist:
{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

We value your partnership and look forward to hearing from you!

Best regards,
Renewal & Upsell Advisor Team

---
This is an automated email. Please do not reply directly to this message.
    """
    
    return subject, html_body, text_body


def get_wellness_check_template(account: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate wellness check-in email template for accounts with renewal > 90 days away.
    This is a friendly check-in to see how things are going.
    
    Args:
        account: Account data dictionary
        
    Returns:
        Tuple of (subject, html_body, text_body)
    """
    account_name = str(account.get("name", "Valued Customer")).strip()
    arr = account.get("arr", 0) or 0
    mrr_raw = account.get("monthly_wise_instalment") or account.get("mrr")
    if mrr_raw is not None and mrr_raw != "":
        try:
            mrr = float(mrr_raw)
        except (TypeError, ValueError):
            mrr = (arr / 12) if arr else 0
    else:
        mrr = (arr / 12) if arr else 0
    health_score = account.get("health_score")
    utilization_percentage = account.get("utilization_percentage", 0)
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    # Format ARR and MRR
    arr_formatted = f"${arr:,.2f}" if arr else "$0"
    mrr_formatted = f"${mrr:,.2f}" if mrr else "$0"
    
    subject = f"Checking In: How's Everything Going, {account_name}?"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
            }}
            .content {{
                background: #ffffff;
            }}
            .csm-block {{
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #eee;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 11px;
                color: #999;
            }}
        </style>
    </head>
    <body>
        <div class="content">
            <p>Hi {account_name} team,</p>
            
            <p>I hope you're doing well!</p>
            
            <p>I wanted to personally reach out and see how everything is going with your subscription. We're committed to your success, and I'd love to hear how the platform is working for you so far.</p>
            
            <p>Are you finding everything you need? If there's anything I can help with—or if you have any feedback on how we can better support you—please don't hesitate to give me a shout.</p>
            
            <p>Always happy to chat!</p>
            
            <div class="csm-block">
                <p>Best regards,<br>
                <strong>{csm_name}</strong><br>
                {f'<a href="mailto:{csm_email}" style="color: #666; text-decoration: none;">{csm_email}</a>' if csm_email else ''}
                </p>
            </div>
            
            <div class="footer">
                <p>Sent via Renewal & Upsell Advisor. Reply directly to this email to reach your CSM.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
Hi {account_name} team,

I hope you're doing well!

I wanted to personally reach out and see how everything is going with your subscription. We're committed to your success, and I'd love to hear how the platform is working for you so far.

Are you finding everything you need? If there's anything I can help with—or if you have any feedback on how we can better support you—please don't hesitate to give me a shout.

Always happy to chat!

Best regards,
{csm_name}
{f'{csm_email}' if csm_email else ''}

---
Sent via Renewal & Upsell Advisor. Reply directly to this email to reach your CSM.
    """
    
    return subject, html_body, text_body


def get_churn_discount_template(account: Dict[str, Any], discount_percentage: int = 20) -> tuple[str, str, str]:
    """
    Generate churn win-back discount email template.
    
    Args:
        account: Account data dictionary
        discount_percentage: The integer percentage discount to offer (e.g. 20)
        
    Returns:
        Tuple of (subject, html_body, text_body)
    """
    account_name = account.get("name", "Valued Customer")
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    subject = f"We miss you, {account_name} - Special Offer Inside"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .highlight {{
                background: #e6fffa;
                padding: 20px;
                border-left: 4px solid #38ef7d;
                margin: 20px 0;
                text-align: center;
                font-size: 18px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 35px;
                background: #11998e;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Come back to {account_name}'s Platform!</h1>
        </div>
        <div class="content">
            <p>Hi {account_name} Team,</p>
            
            <p>We've noticed you recently left us, and we already miss you. We understand that business needs change, but we would love the opportunity to win you back and show you what you're missing.</p>
            
            <div class="highlight">
                <p><strong>Exclusive Reactivation Offer</strong></p>
                <p>Get <strong style="color: #11998e; font-size: 24px;">{discount_percentage}% OFF</strong> your next 12 months if you reactivate your subscription.</p>
            </div>
            
            <p>Since you left, we have launched new features and improvements that we believe can significantly help your revenue operations. Let's get on a quick call to re-assess your needs.</p>
            
            <p style="text-align: center;">
                <a href="#" class="button">Claim My Discount</a>
            </p>
            
            <p>Your previous dedicated Customer Success Manager is ready to assist and apply the discount to your account manually:</p>
            
            <p>
                <strong>{csm_name}</strong><br>
                {f'Email: <a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>
            
            <p>We hope to see you again soon!</p>
            
            <p>Best regards,<br>
            Renewal & Upsell Advisor Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
We miss you, {account_name} - Special Offer Inside

Hi {account_name} Team,

We've noticed you recently left us, and we already miss you. We understand that business needs change, but we would love the opportunity to win you back and show you what you're missing.

Exclusive Reactivation Offer
Get {discount_percentage}% OFF your next 12 months if you reactivate your subscription.

Since you left, we have launched new features and improvements that we believe can significantly help your revenue operations. Let's get on a quick call to re-assess your needs.

Your previous dedicated Customer Success Manager is ready to assist and apply the discount:
{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

We hope to see you again soon!

Best regards,
Renewal & Upsell Advisor Team

---
This is an automated email. Please do not reply directly to this message.
    """
    
    return subject, html_body, text_body
