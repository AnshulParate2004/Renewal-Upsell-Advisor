import random
import asyncio
import os
import stripe

class StripeService:
    def __init__(self):
        stripe_key = os.getenv("STRIPE_API_KEY")
        if stripe_key:
            stripe.api_key = stripe_key
            self.connected = True
            print("Stripe Connected Successfully")
        else:
            self.connected = False
            print("Stripe API Key missing. Using Mock Mode.")

    async def get_payment_health(self, account_id: str) -> dict:
        """
        Fetches payment health from Stripe.
        """
        if self.connected:
            try:
                # Real Stripe Query
                # Assuming 'account_id' is mapped to a Stripe Customer ID stored in our DB, 
                # but for this demo we'll assume account_id might be the Stripe Customer ID or we search for it.
                # Here we search by email or metadata if we had it. 
                # For simplicity, we'll try to list subscriptions where customer = account_id
                
                # Verify if 'account_id' looks like a stripe customer id (cus_...)
                if account_id.startswith("cus_"):
                    subscriptions = stripe.Subscription.list(customer=account_id, limit=1)
                else:
                    # Search by metadata
                    customers = stripe.Customer.search(query=f"metadata['account_id']:'{account_id}'", limit=1)
                    if customers['data']:
                        subscriptions = stripe.Subscription.list(customer=customers['data'][0]['id'], limit=1)
                    else:
                        subscriptions = {'data': []}

                if subscriptions['data']:
                    sub = subscriptions['data'][0]
                    return {
                        "status": "success",
                        "source": "Stripe Payments (Live)",
                        "subscription_status": sub['status'],
                        "last_payment_amount": sub['plan']['amount'] / 100 if sub['plan'] else 0,
                        "payment_failures_l90d": 0, # Requires deeper query on Events/Invoices
                        "next_invoice_date": str(sub['current_period_end'])
                    }
            except Exception as e:
                print(f"Stripe Sync Error: {e}")

        await asyncio.sleep(0.4)
        
        # Randomly generate failure data consistent with risk analysis context
        failures = random.choice([0, 0, 0, 1, 2])
        status = "Active" if failures == 0 else "Past Due"
        
        return {
            "status": "success",
            "source": "Stripe Payments (Mock)",
            "subscription_status": status,
            "last_payment_amount": random.randint(10000, 50000),
            "payment_failures_l90d": failures,
            "next_invoice_date": "2024-04-01"
        }
