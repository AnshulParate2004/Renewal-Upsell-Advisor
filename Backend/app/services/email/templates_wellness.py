"""
Wellness check email template - for accounts with renewal > 90 days away.
"""
from typing import Dict, Any


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
