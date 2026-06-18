## 2026-06-15 - [CRITICAL] Hardcoded Privy App Secret
**Vulnerability:** A hardcoded Privy App Secret was found in `privy-client.js`. This secret was part of the `PRIVY_CONFIG` object and was exposed to the client-side, which is a major security risk.
**Learning:** Privy App Secrets are meant for server-side verification and should never be included in client-side code or repositories. The client-side SDK only requires the App ID.
**Prevention:** Always use environment variables for secrets and ensure they are only accessed in server-side environments. Regularly scan the codebase for hardcoded credentials. Added `.env.example` and untracked `.env` to prevent accidental credential leakage.

## 2026-06-16 - [HIGH] XSS Vulnerabilities in UI Rendering
**Vulnerability:** Multiple Cross-Site Scripting (XSS) vulnerabilities were found in the application's UI. Dynamic data from user input (voice chat), AI responses, and external APIs (politician filings) were rendered using `innerHTML` without sanitization.
**Learning:** Even internal-facing dashboards or AI-driven chat interfaces are susceptible to XSS. Prompt injection can be used to trick an AI into generating malicious HTML/JS, which then executes in the user's browser if rendered unsafely.
**Prevention:** Always sanitize dynamic content before rendering. Use `textContent` or `document.createTextNode()` for simple text. For complex structures, implement a robust `escapeHTML` helper or use a library like DOMPurify. This project now utilizes a centralized `escapeHTML` pattern for dynamic template literals and safer DOM APIs for chat rendering.

## 2026-06-17 - [CRITICAL] Hardcoded Anthropic API Keys
**Vulnerability:** A hardcoded Anthropic API key was found in multiple HTML files, including `index.html`, `index-new.html`, and redundant files in `kivy-app/`.
**Learning:** Redundant file structures and "demo" versions of the application can often harbor legacy hardcoded secrets that were removed from the main entry point but forgotten elsewhere.
**Prevention:** Use global grep scans for known secret patterns (like `sk-ant-`) across the entire repository regularly. Ensure that build artifacts or duplicated assets are either excluded from the repo or included in secret-scrubbing workflows.

## 2026-06-18 - [HIGH] Unprotected Live Execution
**Vulnerability:** The on-chain execution engine (`execution-engine.js`) lacked safety checks, allowing potentially unlimited real-money transactions if live mode were enabled.
**Learning:** Even features intended for "live" use must have safety guardrails (circuit breakers, bet limits) implemented at the code level, not just the config level, to prevent catastrophic failure or accidental activation.
**Prevention:** Implemented the "Sentinel Live Guard" which enforces an explicit `liveExecutionEnabled` flag and a `maxBetUSD` hard cap within the execution core.
