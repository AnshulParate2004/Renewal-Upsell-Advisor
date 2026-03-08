# How to use a tunnel so Twilio can reach your localhost

**What is tunneling?** Your app runs on your PC at `http://localhost:8000`. Twilio’s servers are on the internet and cannot open that address. A **tunnel** gives you a public URL (like `https://xyz.loca.lt`) that forwards traffic to your `localhost:8000`. You run a small program that does this; Twilio calls the public URL, and the tunnel sends the request to your app.

---

## Easiest method: localtunnel (no install, no account)

You only need **Node.js** (you already have it if you use the frontend). No signup, no install.

### Step 1: Start your backend

In a terminal, go to the Backend folder and start the API:

```bash
cd d:\Projects_Main\Renewal-Upsell-Advisor\Backend
uv run uvicorn app.main:app --reload --port 8000
```

Leave this terminal open. The backend must be running on port 8000 before you start the tunnel.

---

### Step 2: Open a second terminal and start the tunnel

Open a **new** terminal (PowerShell or Command Prompt). Run:

```bash
npx localtunnel --port 8000
```

**What you’ll see:** Something like:

```
your url is: https://random-words-123.loca.lt
```

**Copy that full URL** (e.g. `https://random-words-123.loca.lt`). Do **not** add a slash at the end.

**Keep this terminal open.** If you close it, the tunnel stops and Twilio won’t be able to reach you.

---

### Step 3: First-time only – “Tunnel Password” page

The first time you (or Twilio) hit the tunnel URL, localtunnel may show a **“Tunnel Password”** page.

- **The password is your public IP** (the PC running `npx localtunnel --port 8000`).
- To get it: open **https://loca.lt/mytunnelpassword** in your browser on that same PC. The page shows your public IP.
- Copy that IP, paste it into the **Tunnel Password** field, and click **Click to Submit**.

After you submit once, that tunnel URL will work for Twilio without asking again (until your IP or tunnel URL changes).

---

### Step 4: Put the URL in your Backend `.env`

1. Open the file:  
   `d:\Projects_Main\Renewal-Upsell-Advisor\Backend\.env`  
   (If it doesn’t exist, create it in the Backend folder.)

2. Add or edit this line (use **your** tunnel URL from Step 2):

   ```
   WEBHOOK_BASE_URL=https://random-words-123.loca.lt
   ```

   Use the URL you copied. **No space** around `=`. **No slash** at the end.

3. Save the file.

---

### Step 5: Restart the backend

In the terminal where the backend is running (Step 1), stop it (Ctrl+C), then start it again:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Now the backend will use the tunnel URL when it tells Twilio where to send webhooks.

---

### Step 6: Trigger a call

From your app (e.g. Manual Triggers → trigger a voice call), place a test call. Twilio will use the public URL to reach your backend.

---

## Summary: what runs where

| Terminal / thing      | What to do |
|-----------------------|------------|
| **Terminal 1**        | Backend: `uv run uvicorn app.main:app --reload --port 8000` |
| **Terminal 2**        | Tunnel: `npx localtunnel --port 8000` (leave open) |
| **Backend `.env`**    | `WEBHOOK_BASE_URL=https://your-tunnel-url.loca.lt` (no trailing slash) |

Both the backend and the tunnel must be running at the same time when you test Twilio.

---

## Important: Twilio must reach your tunnel

When the call is **answered** or you **press 1**, Twilio’s servers send an HTTP POST to your tunnel URL. If you use **localtunnel**, Twilio may get the “Tunnel Password” page (because Twilio’s IP is not your IP). In that case the request never reaches your backend and Twilio plays “application error.”

- **Fix:** Use **ngrok** for voice testing (no password page; Twilio can reach your app).
- Or open your tunnel URL in a browser, complete the password step, and see if localtunnel then allows Twilio (some tunnels allow it after the first visit).

---

## If localtunnel doesn’t work: try ngrok

1. Install ngrok: [ngrok.com/download](https://ngrok.com/download) (or `choco install ngrok`).
2. Sign up at [ngrok.com](https://ngrok.com) (free) and follow their setup.
3. In a **second** terminal run: `ngrok http 8000`
4. Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`).
5. In `.env` set: `WEBHOOK_BASE_URL=https://abc123.ngrok-free.app`
6. Restart the backend.

Same idea: the tunnel gives you a public URL; you put that URL in `WEBHOOK_BASE_URL` so Twilio can reach your localhost.
