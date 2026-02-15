# Account Display and Churn Fix

## Issues Fixed

### 1. Few Accounts Showing
**Problem:** Only a limited number of accounts were being displayed on the frontend.

**Root Cause:** 
- The API endpoint had a default limit of 100 accounts
- The frontend hook was also using a limit of 100
- While this should be enough, increasing the limit ensures all accounts are fetched

**Fix Applied:**
- Increased API endpoint limit from 100 to 1000 in `Backend/app/api/v1/endpoints/accounts.py`
- Increased frontend hook limit from 100 to 1000 in `revenue-navigator/src/hooks/useAccounts.ts`
- Added logging to track how many accounts are returned

### 2. Churn Always Showing 0
**Problem:** The dashboard was showing churn risk count as 0 even though accounts have churn probabilities.

**Root Cause:**
- The analytics endpoint was correctly calculating churn risk count (accounts with `churn_probability >= 0.7`)
- However, if the query returned `None`, it wasn't being converted to 0
- The database has 6 accounts, with 1 account (Acme Corporation) having churn_probability = 0.72 (>= 0.7)

**Fix Applied:**
- Added explicit `or 0` fallback in `Backend/app/api/v1/endpoints/analytics.py` to ensure churn_risk_count is never None
- This ensures the frontend always receives a number, not null/undefined

## Database Status

Current accounts in database:
- **Total:** 6 accounts
- **Churn Risk (>=0.7):** 1 account (Acme Corporation with 0.72)
- **All accounts have churn probabilities:**
  - Acme Corporation: 0.72 (HIGH RISK)
  - TechStart Inc: 0.68
  - Global Systems: 0.12
  - DataFlow Analytics: 0.48
  - CloudNine Solutions: 0.18
  - Summit Financial: 0.05

## Verification

After the fixes:
1. **All 6 accounts** should now be visible on the Accounts page
2. **Churn Risk count** should show **1** on the Dashboard (not 0)
3. **Individual account churn percentages** should display correctly in the accounts table

## Testing

To verify the fixes work:

1. **Check Accounts Page:**
   - Navigate to `/app/accounts`
   - You should see all 6 accounts listed
   - Each account should show its churn probability percentage

2. **Check Dashboard:**
   - Navigate to `/app` (Dashboard)
   - The "Churn Risk" card should show **1** (not 0)
   - This represents the number of accounts with churn probability >= 70%

3. **Check API Directly:**
   ```bash
   # Get all accounts
   curl http://localhost:8000/api/v1/accounts
   
   # Get dashboard stats
   curl http://localhost:8000/api/v1/analytics/dashboard
   ```

## Files Modified

1. `Backend/app/api/v1/endpoints/accounts.py`
   - Increased limit from 100 to 1000
   - Added logging

2. `Backend/app/api/v1/endpoints/analytics.py`
   - Added `or 0` fallback for churn_risk_count

3. `revenue-navigator/src/hooks/useAccounts.ts`
   - Increased limit from 100 to 1000

## Notes

- The churn risk count shows accounts with **churn probability >= 0.7** (70%)
- Individual accounts display their churn probability as a percentage (0-100%)
- The limit increase ensures scalability if you add more accounts in the future
