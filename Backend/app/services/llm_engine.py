def generate_insight(account_data):
    """
    Mock LLM logic to generate insights based on account data.
    """
    days = account_data.days_to_renewal
    risk_label = account_data.churn_risk_label
    upsell_label = account_data.upsell_opportunity_label
    arr = account_data.arr
    account_id = account_data.account_id
    
    notification = ""
    email_draft = ""
    
    # Logic for High Risk
    if risk_label == 1:
        reason = []
        if account_data.payment_failures > 0:
            reason.append("recent payment failures")
        if account_data.login_drop_rate > 0.3:
            reason.append("significant drop in login activity")
        if account_data.support_tickets > 5:
            reason.append("high volume of support tickets")
        
        reason_str = ", ".join(reason) if reason else "usage patterns detected"
        
        notification = f"🚨 Renewal Alert: Contract for count {account_id} expires in {days} days. High churn risk due to {reason_str}."
        
        email_draft = f"""Subject: Urgent: Executive Business Review for {account_id}

Dear {account_id} Team,

I noticed your contract is coming up for renewal in {days} days, and we want to ensure you're getting the most value from our platform. 

We've detected some challenges regarding {reason_str}, and I'd love to schedule a brief call to address these immediately and discuss your renewal options.

Best regards,
S-007 Advisor"""

    # Logic for Upsell Opportunity
    elif upsell_label == 1:
        notification = f"🚀 Expansion Opportunity: {account_id} is seeing high utilization. Projected expansion revenue available."
        
        email_draft = f"""Subject: Unlocking more value for {account_id}

Dear {account_id} Team,

With your renewal approaching in {days} days, I noticed you are getting great value from our platform, specifically with high utilization rates.

We have a new Premium tier that matches your growth trajectory. Let's discuss how we can support your scaling needs during your renewal.

Best regards,
S-007 Advisor"""
    
    # Logic for Safe/Neutral
    else:
        notification = f"ℹ️ Renewal Notice: Contract for {account_id} expires in {days} days. Account health looks good."
        
        email_draft = f"""Subject: Renewal check-in for {account_id}

Dear {account_id} Team,

Your contract renewal is coming up in {days} days. Everything looks great on our end!

I'll send over the renewal paperwork shortly. Let me know if you have any questions.

Best regards,
S-007 Advisor"""

    return {
        "notification": notification,
        "email_draft": email_draft
    }
