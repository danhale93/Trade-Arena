const express = require('express');
const cors = require('cors');
const app = express();

// Sentinel: Security hardening
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc.)
app.disable('x-powered-by'); // Mitigate information disclosure

// Sentinel: Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https://auth.privy.io https://newassets.hcaptcha.com https://js.hcaptcha.com https://hcaptcha.com; child-src 'self' https://auth.privy.io https://newassets.hcaptcha.com https://js.hcaptcha.com https://hcaptcha.com;");
  next();
});

// Sentinel: Limit JSON payload size to prevent DoS attacks
app.use(express.json({ limit: '100kb' }));
app.use(cors({ origin: '*' }));

const rateLimit = require('express-rate-limit');
const aiProxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 AI requests per window
  message: { error: 'AI rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Sentinel: Whitelisted models to prevent unauthorized expensive API usage
const ALLOWED_CLAUDE_MODELS = new Set([
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet-latest',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
]);

const ALLOWED_OPENAI_MODELS = new Set([
  'gpt-4o',
  'gpt-4o-latest',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo'
]);

const ALLOWED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
]);

app.post('/api/claude', aiProxyLimiter, async (req, res) => {
  let timeout;
  try {
    const { model, messages, system, max_tokens, temperature, top_p, top_k, stop_sequences } = req.body;
    if (!ALLOWED_CLAUDE_MODELS.has(model)) {
      return res.status(400).json({ error: 'Invalid or unauthorized model requested' });
    }

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        system,
        max_tokens: max_tokens || 1024,
        temperature,
        top_p,
        top_k,
        stop_sequences
      }),
      signal: controller.signal
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Sentinel] Claude Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

app.post('/api/openai', aiProxyLimiter, async (req, res) => {
  let timeout;
  try {
    const { model, messages, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, stop } = req.body;
    if (!ALLOWED_OPENAI_MODELS.has(model)) {
      return res.status(400).json({ error: 'Invalid or unauthorized model requested' });
    }

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: max_tokens || 1024,
        temperature,
        top_p,
        frequency_penalty,
        presence_penalty,
        stop
      }),
      signal: controller.signal
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Sentinel] OpenAI Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

app.post('/api/gemini', aiProxyLimiter, async (req, res) => {
  let timeout;
  try {
    const requestedModel = req.body.model || 'gemini-1.5-flash';
    if (!ALLOWED_GEMINI_MODELS.has(requestedModel)) {
      return res.status(400).json({ error: 'Invalid or unauthorized model requested' });
    }

    const safeModel = encodeURIComponent(requestedModel);

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // Sentinel: Move API key to header to prevent leakage in server/proxy logs
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: req.body.contents,
        generationConfig: req.body.generationConfig
      }),
      signal: controller.signal
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Sentinel] Gemini Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

const fs = require('fs');
const path = require('path');

app.post('/api/maintenance/log', (req, res) => {
  const { agent, message, level } = req.body;
  const logDir = path.join(__dirname, '.jules');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logFile = agent === 'SENTINEL' ? 'sentinel.md' : 'maintenance.md';
  const logPath = path.join(logDir, logFile);

  const entry = `\n## ${new Date().toISOString()} - [${level || 'INFO'}] ${agent}\n${message}\n`;
  fs.appendFileSync(logPath, entry);

  res.json({ success: true });
});

app.post('/api/maintenance/patch', async (req, res) => {
  const { filepath, patch, description } = req.body;
  try {
    // Security: Prevent path traversal by resolving and validating path
    const resolvedPath = path.resolve(__dirname, filepath);
    const rootPath = path.resolve(__dirname) + path.sep;
    if (!resolvedPath.startsWith(rootPath) && resolvedPath !== path.resolve(__dirname)) {
      return res.status(403).json({ error: 'Unauthorized path access' });
    }

    if (!fs.existsSync(resolvedPath)) throw new Error('File not found');

    // In a real self-healing system, we would validate the patch
    // For this implementation, we log the intent and could apply it
    console.log(`[Developer Agent] Patch requested for ${filepath}: ${description}`);

    // Simple overwrite for this demo-scale self-healing
    // fs.writeFileSync(resolvedPath, patch);

    res.json({ success: true, message: 'Patch received and logged for review' });
  } catch (error) {
    console.error('[Sentinel] Patch Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`🚀 Proxy server running at http://localhost:${port}`);
  console.log('Set ANTHROPIC_API_KEY env var for Claude');
});

