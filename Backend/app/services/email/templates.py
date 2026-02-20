"""
Email templates for renewal and upsell campaigns.
"""
from typing import Dict, Any
from datetime import datetime


def get_renewal_reminder_template(account: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate renewal reminder email template.
    
    Args:
        account: Account data dictionary
        
    Returns:
        Tuple of (subject, html_body)
    """
    account_name = account.get("name", "Valued Customer")
    renewal_date = account.get("renewal_date")
    arr = account.get("arr", 0)
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    # Format renewal date
    if renewal_date:
        try:
            if isinstance(renewal_date, str):
                renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
            else:
                renewal_dt = renewal_date
            renewal_date_str = renewal_dt.strftime("%B %d, %Y")
        except:
            renewal_date_str = str(renewal_date)
    else:
        renewal_date_str = "soon"
    
    # Format ARR
    arr_formatted = f"${arr:,.2f}" if arr else "$0"
    
    subject = f"Renewal Reminder: {account_name} - Action Required"
    
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                background: #667eea;
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
            <h1>Renewal Reminder</h1>
        </div>
        <div class="content">
            <p>Dear {account_name} Team,</p>
            
            <p>We hope this message finds you well. This is a friendly reminder that your subscription is set to renew on <strong>{renewal_date_str}</strong>.</p>
            
            <div class="highlight">
                <strong>Current Annual Recurring Revenue:</strong> {arr_formatted}
            </div>
            
            <p>To ensure uninterrupted service, please take a moment to review your renewal options:</p>
            
            <ul>
                <li>Review your current plan and usage</li>
                <li>Explore potential upgrades or add-ons</li>
                <li>Confirm your renewal preferences</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="#" class="button">Review Renewal Options</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to your Customer Success Manager:</p>
            
            <p>
                <strong>{csm_name}</strong><br>
                {f'Email: <a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>
            
            <p>Thank you for being a valued customer!</p>
            
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
Renewal Reminder: {account_name}

Dear {account_name} Team,

We hope this message finds you well. This is a friendly reminder that your subscription is set to renew on {renewal_date_str}.

Current Annual Recurring Revenue: {arr_formatted}

To ensure uninterrupted service, please take a moment to review your renewal options:
- Review your current plan and usage
- Explore potential upgrades or add-ons
- Confirm your renewal preferences

If you have any questions or need assistance, please contact your Customer Success Manager:
{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

Thank you for being a valued customer!

Best regards,
Renewal & Upsell Advisor Team

---
This is an automated email. Please do not reply directly to this message.
    """
    
    return subject, html_body, text_body


def get_upsell_opportunity_template(account: Dict[str, Any], opportunity: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Generate upsell opportunity email template.
    
    Args:
        account: Account data dictionary
        opportunity: Opportunity data dictionary
        
    Returns:
        Tuple of (subject, html_body, text_body)
    """
    account_name = account.get("name", "Valued Customer")
    opportunity_type = opportunity.get("type", "upsell").replace("_", " ").title()
    predicted_value = opportunity.get("value", 0)
    probability = opportunity.get("probability", 0)
    recommended_products = opportunity.get("recommended_products", [])
    csm_name = account.get("csm_name", "Your Customer Success Manager")
    csm_email = account.get("csm_email", "")
    
    # Format value
    value_formatted = f"${predicted_value:,.2f}" if predicted_value else "$0"
    probability_percent = f"{probability * 100:.0f}%"
    
    subject = f"Exclusive {opportunity_type} Opportunity for {account_name}"
    
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
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
                background: #d4edda;
                padding: 15px;
                border-left: 4px solid #28a745;
                margin: 20px 0;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #f5576c;
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
            <h1>Exclusive {opportunity_type} Opportunity</h1>
        </div>
        <div class="content">
            <p>Dear {account_name} Team,</p>
            
            <p>We're excited to share a personalized {opportunity_type.lower()} opportunity that we believe would be a great fit for your business!</p>
            
            <div class="highlight">
                <strong>Potential Value:</strong> {value_formatted}<br>
                <strong>Confidence Level:</strong> {probability_percent}
            </div>
            
            {"<p><strong>Recommended Products:</strong></p><ul>" + "".join([f"<li>{product}</li>" for product in recommended_products]) + "</ul>" if recommended_products else ""}
            
            <p>This opportunity is based on your current usage patterns and business needs. We'd love to discuss how this can help accelerate your success.</p>
            
            <p style="text-align: center;">
                <a href="#" class="button">Schedule a Discussion</a>
            </p>
            
            <p>Your Customer Success Manager is ready to help:</p>
            
            <p>
                <strong>{csm_name}</strong><br>
                {f'Email: <a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>
            
            <p>Looking forward to helping you grow!</p>
            
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
Exclusive {opportunity_type} Opportunity for {account_name}

Dear {account_name} Team,

We're excited to share a personalized {opportunity_type.lower()} opportunity that we believe would be a great fit for your business!

Potential Value: {value_formatted}
Confidence Level: {probability_percent}

{"Recommended Products:" if recommended_products else ""}
{chr(10).join([f"- {product}" for product in recommended_products]) if recommended_products else ""}

This opportunity is based on your current usage patterns and business needs. We'd love to discuss how this can help accelerate your success.

Your Customer Success Manager is ready to help:
{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

Looking forward to helping you grow!

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
    account_name = account.get("name", "Valued Customer")
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
    account_name = account.get("name", "Valued Customer")
    arr = account.get("arr", 0)
    mrr = account.get("mrr", 0)
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
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
                background: #e7f3ff;
                padding: 15px;
                border-left: 4px solid #4facfe;
                margin: 20px 0;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                flex-wrap: wrap;
            }}
            .stat-item {{
                text-align: center;
                padding: 15px;
                background: white;
                border-radius: 8px;
                margin: 5px;
                flex: 1;
                min-width: 120px;
            }}
            .stat-value {{
                font-size: 24px;
                font-weight: bold;
                color: #4facfe;
            }}
            .stat-label {{
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #4facfe;
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
            <h1>Just Checking In!</h1>
        </div>
        <div class="content">
            <p>Dear {account_name} Team,</p>
            
            <p>We hope this message finds you well! We wanted to reach out and see how everything is going with your subscription.</p>
            
            <div class="highlight">
                <p><strong>We're here to ensure you're getting the most value from our platform.</strong></p>
            </div>
            
            <p>Here's a quick snapshot of your account:</p>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value">{arr_formatted}</div>
                    <div class="stat-label">Annual Revenue</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{mrr_formatted}</div>
                    <div class="stat-label">Monthly Revenue</div>
                </div>
                {f'<div class="stat-item"><div class="stat-value">{utilization_percentage:.0f}%</div><div class="stat-label">Utilization</div></div>' if utilization_percentage else ''}
                {f'<div class="stat-item"><div class="stat-value">{health_score}/100</div><div class="stat-label">Health Score</div></div>' if health_score is not None else ''}
            </div>
            
            <p>We'd love to hear from you:</p>
            <ul>
                <li>How are things going with the platform?</li>
                <li>Are you finding everything you need?</li>
                <li>Is there anything we can help you with?</li>
                <li>Any feedback or suggestions?</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="#" class="button">Share Your Feedback</a>
            </p>
            
            <p>If you have any questions, concerns, or just want to chat about how we can better support your business, please don't hesitate to reach out to your Customer Success Manager:</p>
            
            <p>
                <strong>{csm_name}</strong><br>
                {f'Email: <a href="mailto:{csm_email}">{csm_email}</a>' if csm_email else ''}
            </p>
            
            <p>Thank you for being a valued customer. We're here to help you succeed!</p>
            
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
Checking In: How's Everything Going, {account_name}?

Dear {account_name} Team,

We hope this message finds you well! We wanted to reach out and see how everything is going with your subscription.

We're here to ensure you're getting the most value from our platform.

Here's a quick snapshot of your account:
- Annual Revenue: {arr_formatted}
- Monthly Revenue: {mrr_formatted}
{f'- Utilization: {utilization_percentage:.0f}%' if utilization_percentage else ''}
{f'- Health Score: {health_score}/100' if health_score is not None else ''}

We'd love to hear from you:
- How are things going with the platform?
- Are you finding everything you need?
- Is there anything we can help you with?
- Any feedback or suggestions?

If you have any questions, concerns, or just want to chat about how we can better support your business, please don't hesitate to reach out to your Customer Success Manager:

{csm_name}
{f'Email: {csm_email}' if csm_email else ''}

Thank you for being a valued customer. We're here to help you succeed!

Best regards,
Renewal & Upsell Advisor Team

---
This is an automated email. Please do not reply directly to this message.
    """
    
    return subject, html_body, text_body
