# How voice calls are connected

## Flow (what happens when you trigger a call)

1. **You trigger a call** (Manual Triggers → Trigger for one → Select customer → Trigger call).
2. **Frontend** sends `POST /api/v1/voice/trigger-call-to-account` with `account_id` and optional `purpose`.
3. **Backend** loads the account (id, name, primary_contact_phone, contract dates), creates a row in `voice_calls`, then asks **Twilio** to place an outbound call:
   - **From:** your Twilio phone number
   - **To:** account’s `primary_contact_phone`
   - **URL:** your backend webhook, e.g. `https://your-domain.com/api/v1/voice/handle-call?call_id=<id>`
4. **Twilio** dials the customer. When they **answer**, Twilio sends an HTTP POST to that URL.
5. **Backend** `handle-call` webhook runs: loads the call record and account, builds the script (using purpose if provided), returns **TwiML** (XML) that tells Twilio what to say.
6. **Twilio** plays the script to the customer (and any trial-account message if you’re on a trial). After the call, Twilio can send status to `call-status` and recording to `recording-status`.

So the call is “connected” when Twilio dials the number and the customer answers; your backend only needs to be reachable at the webhook URL so Twilio can fetch the script.

---

## What you need for calls to connect

### 1. Twilio credentials (in `.env` or environment)

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (E.164, e.g. `+1234567890`)

### 2. Webhook URL reachable by Twilio

- Set **`WEBHOOK_BASE_URL`** to the **public** base URL of your backend (e.g. `https://your-backend.herokuapp.com` or your ngrok URL when testing).
- Twilio will call:
  - `{WEBHOOK_BASE_URL}/api/v1/voice/handle-call?call_id=...` when the call is answered
  - `{WEBHOOK_BASE_URL}/api/v1/voice/call-status` for status updates
- If the backend is only on `localhost`, Twilio cannot reach it. Use a tunnel (e.g. **ngrok**) and set `WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io`.

### 3. Account has a phone number

- The account’s **primary_contact_phone** must be set in the database (E.164 format).
- If it’s missing, the backend will not place the call.

### 4. (Optional) Upgrade Twilio to paid

- On a **trial** account, Twilio plays a short message before your script (“you can remove this by upgrading…”). That is Twilio’s message, not from your code.
- To remove it, upgrade the Twilio project to a paid account and add balance in the Twilio console.

---

## Quick checklist

| Item                         | Check |
|-----------------------------|--------|
| `TWILIO_ACCOUNT_SID` set    |       |
| `TWILIO_AUTH_TOKEN` set     |       |
| `TWILIO_PHONE_NUMBER` set   |       |
| `WEBHOOK_BASE_URL` = public URL of your backend |       |
| Account has `primary_contact_phone` |       |
| Backend is running and reachable at `WEBHOOK_BASE_URL` |       |
