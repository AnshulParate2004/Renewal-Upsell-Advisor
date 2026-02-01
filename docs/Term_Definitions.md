# Term Definitions & Concepts

Specific definitions and differences for key terms in the S-007 Renewal & Upsell Advisor.

## 1. Churn Prediction
**Definition:** The use of machine learning models to calculate the probability (0-100%) that a customer will cancel their contract.

*   **Goal:** To identify at-risk accounts 60-90 days before their contract expires so the team can intervene early.
*   **How it Works:** The system analyzes multiple signals:
    *   **Usage:** Declining login frequency or feature adoption.
    *   **Support:** High volume of tickets or long resolution times.
    *   **Financial:** Late payments or failed charges.
    *   **Sentiment:** Negative trends in email communication.
*   **Output:** It assigns a "Risk Score" and segments customers into High, Medium, or Low risk categories.

## 2. Upsell Propensity
**Definition:** The likelihood that a current customer is ready to purchase additional services, seats, or premium features.

*   **Goal:** To increase expansion revenue by 15-25% by identifying "Qualified" opportunities automatically.
*   **Triggers:** The system flags a customer for upsell if:
    *   **License Utilization:** They use >80% of their purchased seats.
    *   **Storage/API:** They exceed 75% of storage or approach API rate limits.
    *   **Feature Usage:** They heavily use premium features while on a basic plan.
*   **Output:** An estimated "Expansion Revenue" value (e.g., "$75K additional ARR") and a win probability score.

## 3. Automated Playbooks vs. Real-Time Alerts
The main difference is that one is a **Warning** and the other is a **Solution**.

| Feature | What is it? | Example |
| :--- | :--- | :--- |
| **Real-Time Alert** | The Notification that tells you something just happened. It is the "Siren." | "Ping! Account Acme Corp just turned High Risk." |
| **Automated Playbook** | The Strategy & Tools that tell you what to do about it. It is the "Recipe." | "Since Acme is High Risk, schedule an Executive Review. Here is the email template to send." |

**Key Distinction:** Alerts simply notify you (via Slack/Email) that a threshold was crossed. Playbooks provide the specific steps, timeline (cadence), and pre-written message templates to solve the problem.

## 4. Real-Time Alerts
**Definition:** Instant notifications sent to the Sales or Success team immediately when a specific data event occurs.

*   **Triggers:** Alerts are generated for:
    *   Detection of High-Risk accounts.
    *   Identification of a new Upsell Opportunity.
    *   Payment failures (via Stripe).
    *   Significant drops in usage.
*   **Channels:** These are delivered via Slack, Microsoft Teams, Email, or In-App notifications.

## 5. Sentiment Analysis
**Definition:** The use of Natural Language Processing (NLP) to read customer emails and determine if their attitude is Positive, Neutral, or Negative.

*   **Application:**
    *   **Churn:** It detects "Sentiment Shifts" (e.g., a declining trend over 30 days), which increases the Risk Score.
    *   **Upsell:** It identifies positive sentiment, which helps qualify a customer for an upsell pitch.
*   **Tools:** The document specifies using libraries like `spaCy` or `Hugging Face` to analyze this text.

## 6. Stripe Integration
**Definition:** A connection to the billing platform to ingest financial data that indicates risk or opportunity.

*   **Data Points:**
    *   **Payment History:** Tracking late payments or failed charges (a key churn signal).
    *   **Plan Details:** Knowing the current subscription tier to identify whitespace for upsells.
*   **Mechanism:** It uses Webhooks to listen for events in real-time (e.g., `invoice.payment_failed`) so the risk score can be updated immediately.
