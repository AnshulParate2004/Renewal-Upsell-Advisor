import pandas as pd
import random
from datetime import datetime, timedelta

def generate_s007_dataset(num_records=1000):
    data = []
    
    industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing']
    tiers = ['Basic', 'Pro', 'Enterprise']

    print(f"Generating {num_records} synthetic records for S-007 Advisor...")

    for i in range(num_records):
        # --- 1. Basic Account Info ---
        account_id = f"ACC-{1000 + i}"
        industry = random.choice(industries)
        tier = random.choice(tiers)
        
        # Random ARR based on Tier
        if tier == 'Basic':
            arr = random.randint(5000, 20000)
        elif tier == 'Pro':
            arr = random.randint(20000, 50000)
        else: # Enterprise
            arr = random.randint(50000, 250000)

        # --- 2. Contract & Renewal Data (FR-1) ---
        # Randomize days until renewal (between -30 days ago and 365 days future)
        days_to_renewal = random.randint(-30, 365)
        renewal_date = (datetime.now() + timedelta(days=days_to_renewal)).strftime('%Y-%m-%d')

        # --- 3. Risk Signals (FR-2 inputs) ---
        # Login Frequency Drop: 0.0 to 1.0 (e.g., 0.45 = 45% drop)
        login_freq_drop = round(random.uniform(0.0, 0.8), 2)
        
        # Support Health: Tickets (0-15) and Resolution Time (hours)
        support_tickets = random.randint(0, 15)
        resolution_time_hours = random.randint(2, 72)
        
        # Billing Health: 0 = Good, 1 = Has Failed Payments
        payment_failures = 1 if random.random() < 0.15 else 0  # 15% chance of payment issues
        
        # Sentiment: NPS Score (0-10)
        nps_score = random.randint(0, 10)

        # --- 4. Upsell Signals (FR-3 inputs) ---
        # License Utilization: 0.0 to 1.0 (Target > 0.80)
        license_utilization = round(random.uniform(0.1, 1.0), 2)
        
        # Storage Utilization: 0.0 to 1.0 (Target > 0.75)
        storage_utilization = round(random.uniform(0.1, 1.0), 2)
        
        # Feature Usage Score: 0-100 (High usage of premium features)
        feature_usage_score = random.randint(10, 100)

        # --- 5. TARGET LABEL LOGIC (The "Ground Truth") ---
        # We start with False/0 and turn it to True/1 based on rules + some randomness
        
        # A. Churn Risk Logic
        # Rules: High login drop, High tickets, Low NPS, or Payment Failures
        is_high_risk = 0
        risk_factors = 0
        
        if login_freq_drop > 0.40: risk_factors += 1
        if support_tickets > 5: risk_factors += 1
        if payment_failures == 1: risk_factors += 2 # Heavy weight
        if nps_score < 6: risk_factors += 1
        
        # If 2+ bad signals present, mark as High Risk
        if risk_factors >= 2:
            is_high_risk = 1

        # B. Upsell Opportunity Logic
        # Rules: High License Util OR High Storage Util
        is_upsell_opp = 0
        if (license_utilization > 0.80) or (storage_utilization > 0.75):
            is_upsell_opp = 1
            
        # Edge case: Don't upsell if they are about to churn!
        if is_high_risk == 1:
            is_upsell_opp = 0

        # --- Append Record ---
        data.append([
            account_id, industry, tier, arr, renewal_date, days_to_renewal,
            login_freq_drop, support_tickets, resolution_time_hours, payment_failures, nps_score,
            license_utilization, storage_utilization, feature_usage_score,
            is_high_risk, is_upsell_opp
        ])

    # --- Create DataFrame and Save ---
    columns = [
        'Account_ID', 'Industry', 'Tier', 'ARR', 'Renewal_Date', 'Days_To_Renewal',
        'Login_Drop_Rate', 'Support_Tickets', 'Resolution_Time_Hours', 'Payment_Failures', 'NPS_Score',
        'License_Utilization', 'Storage_Utilization', 'Feature_Usage_Score',
        'Churn_Risk_Label', 'Upsell_Opportunity_Label'
    ]
    
    df = pd.DataFrame(data, columns=columns)
    
    # Save to CSV
    filename = 's007_synthetic_data.csv'
    df.to_csv(filename, index=False)
    print(f"✅ Successfully generated {filename} with shape {df.shape}")
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    generate_s007_dataset()