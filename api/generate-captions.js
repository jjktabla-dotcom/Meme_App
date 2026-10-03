// Vercel serverless function (Node runtime).
// Keeps the Gemini API key on the server so visitors never need their own key.
// Configure GEMINI_API_KEY in your hosting provider's environment variables —
// never hardcode it here.

const ALLOWED_MODELS = new Set(['gemini-3.1-flash-lite', 'gemini-2.5-flash']);

// Very small in-memory rate limiter. Resets whenever the function cold-starts,
// so it's a friendly speed bump, not a hard guarantee — good enough to stop
// one visitor from burning through the free-tier rate limit for everyone else.
const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function isAllowed(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length <= MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed.' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'Server is missing GEMINI_API_KEY. Add it in your hosting provider\'s environment variable settings.' }
    });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (!isAllowed(ip)) {
    return res.status(429).json({ error: { message: 'Too many requests from this device — please wait a few minutes and try again.' } });
  }

  const { model, parts } = req.body || {};
  if (!model || !ALLOWED_MODELS.has(model) || !Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ error: { message: 'Bad request.' } });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 1, maxOutputTokens: 512 }
        })
      }
    );
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: 'Could not reach Gemini right now — try again.' } });
  }
}
