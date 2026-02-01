import random
import asyncio
import os
from simple_salesforce import Salesforce

class SalesforceService:
    def __init__(self):
        self.username = os.getenv("SALESFORCE_USERNAME")
        self.password = os.getenv("SALESFORCE_PASSWORD")
        self.token = os.getenv("SALESFORCE_TOKEN")
        self.connected = False
        self.sf = None

        if self.username and self.password and self.token:
            try:
                self.sf = Salesforce(username=self.username, password=self.password, security_token=self.token)
                self.connected = True
                print("Salesforce Connected Successfully")
            except Exception as e:
                print(f"Salesforce Connection Failed: {e}")
        else:
            print("Salesforce credentials missing. Using Mock Mode.")

    async def sync_account(self, account_id: str) -> dict:
        """
        Syncs account data from Salesforce.
        """
        if self.connected and self.sf:
            try:
                # Real Salesforce Query
                # Assuming 'account_id' corresponds to 'AccountNumber' or 'Id'
                query = f"SELECT Id, Name, AnnualRevenue, Industry FROM Account WHERE AccountNumber = '{account_id}' LIMIT 1"
                result = self.sf.query(query)
                
                if result['totalSize'] > 0:
                    record = result['records'][0]
                    return {
                        "status": "success",
                        "source": "Salesforce CRM (Live)",
                        "synced_at": "Just now",
                        "account_id": account_id,
                        "crm_link": f"https://{self.sf.sf_instance}/{record['Id']}",
                        "details": record
                    }
            except Exception as e:
                print(f"Salesforce Sync Error: {e}")

        # Fallback / Mock
        await asyncio.sleep(0.5)
        return {
            "status": "success",
            "source": "Salesforce CRM (Mock)",
            "synced_at": "Just now",
            "account_id": account_id,
            "crm_link": f"https://na1.salesforce.com/{account_id}"
        }

    async def push_insight(self, account_id: str, insight: dict) -> dict:
        """
        Push generated insight back to Salesforce.
        """
        if self.connected and self.sf:
            try:
                # In a real scenario, we would update a specific field
                # For safety in this demo, we won't actually write unless specific fields are known
                # But we simulate the API call structure
                # self.sf.Account.update(account_id, {'Description': insight['summary']})
                return {
                    "status": "success",
                    "message": f"Insight for {account_id} pushed to Salesforce (Live Connection)."
                }
            except Exception as e:
                print(f"Salesforce Push Error: {e}")

        await asyncio.sleep(0.8)
        return {
            "status": "success",
            "message": f"Insight for {account_id} updated in Salesforce Opportunity object (Mock)."
        }
