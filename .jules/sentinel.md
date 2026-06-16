## 2026-06-15 - [CRITICAL] Hardcoded Privy App Secret
**Vulnerability:** A hardcoded Privy App Secret was found in `privy-client.js`. This secret was part of the `PRIVY_CONFIG` object and was exposed to the client-side, which is a major security risk.
**Learning:** Privy App Secrets are meant for server-side verification and should never be included in client-side code or repositories. The client-side SDK only requires the App ID.
**Prevention:** Always use environment variables for secrets and ensure they are only accessed in server-side environments. Regularly scan the codebase for hardcoded credentials. Added `.env.example` and untracked `.env` to prevent accidental credential leakage.

## 2026-06-16 - [HIGH] XSS Vulnerabilities in UI Rendering
**Vulnerability:** Multiple Cross-Site Scripting (XSS) vulnerabilities were found in the application's UI. Dynamic data from user input (voice chat), AI responses, and external APIs (politician filings) were rendered using `innerHTML` without sanitization.
**Learning:** Even internal-facing dashboards or AI-driven chat interfaces are susceptible to XSS. Prompt injection can be used to trick an AI into generating malicious HTML/JS, which then executes in the user's browser if rendered unsafely.
**Prevention:** Always sanitize dynamic content before rendering. Use `textContent` or `document.createTextNode()` for simple text. For complex structures, implement a robust `escapeHTML` helper or use a library like DOMPurify. This project now utilizes a centralized `escapeHTML` pattern for dynamic template literals and safer DOM APIs for chat rendering.
