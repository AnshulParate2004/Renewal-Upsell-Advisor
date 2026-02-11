# Term Definitions & Concepts

Key terms for the **S-007 Autonomous Revenue Agent**.

## 1. Autonomous Revenue Agent
**Definition:** A system that actively *executes* revenue workflows (sending quotes, making calls) rather than just recommending them.
*   **Contrast:** "Advisor" advises; "Agent" acts.

## 2. 24-Hour Analysis Loop
**Definition:** The daily cycle where the system re-evaluates **Churn Risk**, **Sentiment**, and **Upsell Propensity** for every account based on the latest 24 hours of data.
*   **Goal:** To catch fast-moving risks (e.g., a support ticket spike) immediately.

## 3. Yagna-Style Triggers
**Definition:** A specific set of time-based automation rules derived from channel best practices:
*   **T-90:** Early Quote.
*   **T-60:** Adoption Check.
*   **T-30:** Urgent Quote with Payment Link.

## 4. Closed-Loop Voice Outreach
**Definition:** A voice workflow that doesn't just "make a call" but handles the *outcome* logic:
*   **Success:** Call picked up, transcript logged.
*   **Retry Loop:** Call missed -> System automatically schedules a retry for a later time block.

## 5. Upsell Propensity
**Definition:** The calculated likelihood (0-100%) that a customer needs more seats or features.
*   **Trigger:** Utilization > 85%.

## 6. Churn Prediction
**Definition:** The probability (0-100%) that a customer will cancel, based on usage drops, sentiment, and support volume.
