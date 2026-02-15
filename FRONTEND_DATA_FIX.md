# Frontend Data Issue - Fix Guide

## Problem
The frontend is not showing any data because the database is empty.

## Solution

### Step 1: Start the Backend Server

Make sure the backend is running:

```bash
cd Backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Seed the Database

In a new terminal, run the seed script:

```bash
cd Backend
uv run python scripts/seed_db.py
```

You should see:
```
Starting database seeding...
Seeded 6 accounts
Seeded 4 opportunities

Database seeding completed successfully!
```

**Note:** If you see "Accounts already exist. Skipping seed.", the database already has data. If you want to reset, delete `Backend/app.db` and run the seed script again.

### Step 3: Verify Backend is Working

Test the API endpoint:

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/accounts" | Select-Object -ExpandProperty Content
```

**Or open in browser:**
- http://localhost:8000/api/v1/accounts
- http://localhost:8000/docs (Swagger UI)

You should see JSON data with account information.

### Step 4: Start the Frontend

Make sure the frontend is running:

```bash
cd revenue-navigator
npm run dev
```

The frontend should be running on http://localhost:8080

### Step 5: Check Browser Console

Open the browser developer tools (F12) and check:
1. **Console tab** - Look for any errors
2. **Network tab** - Check if API calls are being made and their status

Common issues:
- **CORS errors**: Make sure backend CORS_ORIGINS includes `http://localhost:8080`
- **Connection refused**: Backend is not running
- **404 errors**: API endpoint path is incorrect
- **Empty responses**: Database is empty (run seed script)

### Step 6: Verify CORS Configuration

Check `Backend/app/core/config.py`:
```python
CORS_ORIGINS: list[str] = ["http://localhost:8080", "http://localhost:3000"]
```

Or set in `.env`:
```
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

## Quick Test

1. **Backend health check:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/health"
   ```

2. **Get accounts:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/api/v1/accounts"
   ```

3. **Get dashboard stats:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/api/v1/analytics/dashboard"
   ```

## Expected Data

After seeding, you should have:
- **6 accounts** with various health scores, churn probabilities, etc.
- **4 opportunities** linked to accounts

The frontend should display:
- Dashboard with metrics (Total ARR, Churn Risk, etc.)
- Accounts list with all 6 accounts
- Account details when clicking on an account
- Opportunities list
- Analytics charts

## Troubleshooting

### No Data Still Showing

1. **Check backend logs** - Look for errors in the terminal where backend is running
2. **Check browser console** - Look for API errors
3. **Verify API base URL** - Check `revenue-navigator/src/lib/api/config.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
   ```
4. **Check database** - Verify accounts exist:
   ```bash
   cd Backend
   uv run python -c "from app.db.session import SessionLocal; from app.models.account import Account; db = SessionLocal(); print(f'Accounts: {db.query(Account).count()}')"
   ```

### Database Reset

To completely reset the database:

1. Stop the backend server
2. Delete `Backend/app.db` (if using SQLite)
3. Restart backend (tables will be recreated)
4. Run seed script again

### Port Conflicts

If port 8000 is already in use:
1. Change backend port in `Backend/app/main.py` or use `--port` flag
2. Update frontend API config to match

## Summary

The most common issue is an **empty database**. Always run the seed script after setting up the backend:

```bash
cd Backend
uv run python scripts/seed_db.py
```

This will populate the database with sample data that the frontend can display.
