# Supabase Setup Guide for Renewal-Upsell-Advisor

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `renewal-upsell-advisor` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - Click "Create new project"

## Step 2: Get Your Supabase Credentials

Once your project is created, go to **Settings** → **API**:

### You'll need these credentials:

1. **Project URL**
   - Found under "Project URL"
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Example: `https://abcdefghijklmnop.supabase.co`

2. **Anon/Public Key** (for client-side access)
   - Found under "Project API keys" → "anon" `public`
   - This is safe to use in frontend code
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Service Role Key** (for server-side/admin - KEEP SECRET!)
   - Found under "Project API keys" → "service_role" `secret`
   - ⚠️ **NEVER expose this in frontend code!**
   - Only use in backend/server environments
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Execute the Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `database_schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for execution to complete (should see "Success" message)

**⚠️ IMPORTANT**: 
- The schema has been fixed to create `contacts` table BEFORE `accounts` table to avoid foreign key errors.
- All indexes use `IF NOT EXISTS` so you can safely re-run the schema if needed.
- If you get "relation already exists" errors, you can either:
  - **Option A**: Uncomment the DROP statements at the top of the schema file (lines 25-40) to start fresh
  - **Option B**: The schema will skip creating existing indexes/tables (safe to re-run)

## Step 4: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see all these tables:
   - `accounts`
   - `contacts`
   - `usage_metrics`
   - `support_tickets`
   - `churn_predictions`
   - `upsell_opportunities`
   - `sentiment_analysis`
   - `email_campaigns`
   - `voice_calls`
   - `renewal_quotes`
   - `renewal_events`
   - `transactions`
   - `salesforce_sync_log`
   - `activity_logs`
   - `webhook_events`
   - `ml_training_logs`

## Step 5: Set Up Row Level Security (RLS)

After creating tables, configure Row Level Security policies:

1. In Supabase SQL Editor, open the file `docs/RLS_POLICIES.sql`
2. Copy and paste the entire contents
3. Click **"Run"**

This will enable RLS on all tables and create development policies that allow full access. **⚠️ Remember to replace these with proper production policies later!**

## Step 6: Backend Configuration

**Since data comes from your backend API (not directly from Supabase):**

1. Configure your backend to use Supabase as the database
2. See `docs/BACKEND_API_SETUP.md` for backend configuration details
3. The frontend will call your backend API endpoints (see `revenue-navigator/src/lib/api.ts`)

### Backend Environment Variables

Your backend should use these credentials:

```env
SUPABASE_URL=https://qrfhjwyrpqdardofwayj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZmhqd3lycHFkYXJkb2Z3YXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1ODI4OCwiZXhwIjoyMDg0OTM0Mjg4fQ.tCrPkvz-3jfKOfBiPUWBei9Ownz23TuyxQf14OReZx8
```

### Frontend Environment Variables

Create `.env` in `revenue-navigator/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## What to Provide Me

Once you have your Supabase project set up, provide me with:

1. **Project URL**: `https://xxxxx.supabase.co`
2. **Anon Key**: The public/anonymous key (safe to share)
3. **Service Role Key**: Only if you need backend integration (keep secret otherwise)

I can then help you:
- Set up the database connection in your app
- Create API functions to interact with Supabase
- Set up proper RLS policies
- Create data migration scripts

## Important Notes

- ⚠️ **Never commit your `.env` file to git!**
- ⚠️ **Never expose Service Role Key in frontend code!**
- ✅ The Anon Key is safe to use in frontend
- ✅ Use Service Role Key only in secure backend environments
- ✅ Enable RLS policies for production security
