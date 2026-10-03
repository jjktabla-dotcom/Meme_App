# Caption This — AI Meme Caption Generator

A web app that takes an uploaded image (or a typed description of a scene) and uses Google's
Gemini API to generate funny, ready-to-post meme captions.

Built as a capstone project covering: requirements/UI-UX (Module 1), front-end development
(Module 2), API integration (Module 3), and deployment (Module 4).

## Why there's a tiny backend

A plain static site can't hide a secret: anything in the page's HTML/JS is visible to any visitor
who opens dev tools. So there are only two honest options —

1. **Everyone pastes their own free key.** Simple, but not beginner-friendly for people who don't
   know what an API key is.
2. **One small serverless function holds the key.** Visitors just use the app — no key, no setup.

This project uses option 2 by default: `api/generate-captions.js` is a serverless function that
reads your Gemini key from a server-side environment variable and forwards requests to Google.
The browser never sees the key. Option 1 is kept as an automatic fallback (see below), so the app
still works even on hosts that can't run a backend function, like plain GitHub Pages.

## Project structure

```
index.html                   the entire front end (HTML + CSS + JS, no framework)
api/generate-captions.js     serverless function that holds the Gemini key server-side
README.md                    this file
```

## 1. Get a free Gemini API key (no credit card)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with a Google account.
3. Click **Create API key**. No billing information is requested for the free tier.

**Model note:** this app defaults to `gemini-3.1-flash-lite`, which is free-tier and has no
announced shutdown date. `gemini-2.5-flash` is offered as an alternate, but Google has scheduled
it for shutdown on **October 16, 2026** — don't rely on it past that date.

## 2. Deploy it live (required for the assignment)

The function in `api/` needs a host that runs serverless functions. **Vercel** is the easiest free
option with no credit card required.

### Deploy to Vercel (recommended — gives the "no key needed" experience)
1. Push this folder to a new GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in, click **Add New → Project**, and import that repo.
3. Vercel auto-detects `index.html` and the `api/` folder — no build configuration needed. Click **Deploy**.
4. Once deployed, go to **Project Settings → Environment Variables** and add:
   - Key: `GEMINI_API_KEY`
   - Value: *(paste your key from AI Studio)*
5. Redeploy (Settings changes require a redeploy — click **Deployments → ⋯ → Redeploy**).
6. Visit your live `*.vercel.app` URL — the app now works for any visitor with no key of their own.

### Alternative: Netlify Functions
Netlify also runs serverless functions for free, but expects them in a `netlify/functions`
folder with a slightly different function signature than Vercel's. If you'd rather use Netlify,
move the logic from `api/generate-captions.js` into that format and set `GEMINI_API_KEY` under
**Site settings → Environment variables**.

### Alternative: GitHub Pages (static only — key required)
GitHub Pages only serves static files; it can't run `api/generate-captions.js`. If you deploy
there, the app will automatically detect the missing backend and prompt each visitor to paste
their own free key in the ⚙️ settings panel instead. This still satisfies the assignment's
"deployed live" requirement, just with the less beginner-friendly key-per-user experience.

## 3. Try it locally first

- **Front end only:** double-click `index.html` to open it directly, or serve it with
  `python3 -m http.server 8000`. Without a deployed backend, paste a personal key in settings to test.
- **Full stack (with the function):** install the [Vercel CLI](https://vercel.com/docs/cli)
  (`npm i -g vercel`), run `vercel dev` in this folder, add `GEMINI_API_KEY` when prompted (or in
  a local `.env` file), and open the URL it gives you. This runs the real `/api/generate-captions`
  function locally so you can test the no-key experience before deploying.

## 4. Record the demo video

1. Open the **live deployed URL** (not localhost).
2. Show that no key is required: upload an image and get captions straight away.
3. Switch to "Describe it" and generate captions from a typed scene instead.
4. Show the copy button working.
5. Post the video publicly on Facebook, tagging the instructor as required.

## How the no-key fallback works (for grading / code quality notes)

- On every generate click, if the visitor hasn't entered a personal key, the app calls
  `/api/generate-captions` first.
- If that route doesn't exist (a 404, e.g. on a static-only host), the app automatically opens the
  settings panel and asks for a personal key instead of failing silently.
- If a visitor *has* pasted a personal key, that's used directly, which also makes local testing
  and grading easier without needing the function deployed.
- The serverless function applies a small per-IP rate limit (10 requests / 10 minutes) so one
  visitor can't burn through the free-tier quota for everyone else. It resets whenever the
  function cold-starts, so treat it as a courtesy limit, not a hard guarantee.

## Known limitations

- The rate limiter is in-memory and per-function-instance, so it's approximate under serverless
  cold starts — fine for a classroom demo, not meant for production-scale traffic.
- Gemini's free tier is rate-limited account-wide; very heavy classroom testing right before a
  deadline could occasionally return a rate-limit error, which the app surfaces as a friendly
  message rather than crashing.
