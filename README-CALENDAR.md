# Calendar Worker — Deployment Guide

This guide explains how to deploy `calendar-worker.js` to **Cloudflare Workers free tier**
so the Trejdovo app can fetch economic calendar data without CORS errors.

---

## Why is this needed?

GitHub Pages runs in a browser. Browsers block cross-origin requests to
`nfs.faireconomy.media` (Forex Factory) because that server does not send
CORS headers. The Cloudflare Worker acts as a relay — it fetches the data
server-side and adds the required CORS headers before returning it to your app.

---

## Prerequisites

- A free Cloudflare account at https://dash.cloudflare.com (no credit card needed)

---

## Step-by-step deployment

### 1. Log in to Cloudflare

Go to https://dash.cloudflare.com and sign in (or create a free account).

### 2. Open Workers & Pages

In the left sidebar click **Workers & Pages**.

### 3. Create a new Worker

Click **Create application** → **Create Worker**.

Give it a name, for example: `trejdovo-calendar`

Click **Deploy** (deploys the default "Hello World" worker — you will replace the code next).

### 4. Edit the Worker code

After deployment click **Edit code** (top-right of the worker page).

In the code editor, **select all** existing code and **delete it**.

Open the file `calendar-worker.js` from this repository and **paste its entire contents**
into the editor.

Click **Save and deploy**.

### 5. Copy your Worker URL

After saving, Cloudflare shows your Worker URL at the top of the page.
It looks like:

```
https://trejdovo-calendar.<your-subdomain>.workers.dev
```

Copy this URL.

### 6. Update the app

Open `index.html` and find this line (search for `CALENDAR_WORKER_URL`):

```javascript
const CALENDAR_WORKER_URL = '';
```

Replace the empty string with your Worker URL:

```javascript
const CALENDAR_WORKER_URL = 'https://trejdovo-calendar.<your-subdomain>.workers.dev';
```

Save and commit the file.

### 7. Test it

Open your Worker URL directly in a browser — you should see raw JSON data
from the Forex Factory calendar.

Then open the Trejdovo app and go to the **Calendar** tab. It should load
today's events without any "Brak połączenia" error.

---

## Free tier limits

Cloudflare Workers free tier allows **100,000 requests per day**.
The Trejdovo app fetches the calendar at most a few times per session,
so you will never come close to this limit.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Calendar still shows "Brak połączenia" | Check that `CALENDAR_WORKER_URL` in `index.html` is set correctly (no trailing slash) |
| Worker returns 502 | Forex Factory upstream is temporarily down — the app falls back to other proxies automatically |
| CORS error in console | Make sure you saved and deployed the Worker after pasting the code |
| Worker URL not found | Check Workers & Pages dashboard — the Worker may have been deployed to a different subdomain |
