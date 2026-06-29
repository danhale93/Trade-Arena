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

## 2026-06-18 - [HIGH] XSS Vulnerability in Crucible Results Modal
**Vulnerability:** The `showCrucibleResults` function in `index.html` rendered the `results.mode` property directly into an `innerHTML` sink without sanitization.
**Learning:** Even metadata fields that are expected to be internal strings can be dangerous if there is any path for user-controlled data to reach them. Template literals in `innerHTML` are a common source of XSS.
**Prevention:** Always use the `escapeHTML` helper when rendering any string into an `innerHTML` template, or prefer safer alternatives like `textContent` for individual elements.

## 2026-06-19 - [CRITICAL] Path Traversal in Maintenance Patch Endpoint
**Vulnerability:** The `/api/maintenance/patch` endpoint in `proxy.js` was vulnerable to path traversal. It used `path.join(__dirname, filepath)` with unsanitized user input, allowing access to any file on the system.
**Learning:** `path.join` does not prevent traversing above the base directory if the input contains `../`. `path.resolve` combined with a prefix check is necessary.
**Prevention:** Resolve the target path and ensure it starts with the intended root directory. Use `path.resolve(__dirname) + path.sep` to prevent partial path bypasses (e.g., `/app` vs `/app-secrets`).

## 2026-06-20 - [HIGH] Fail-Open and Incorrect Signature Verification in MoonPay Webhook
**Vulnerability:** The MoonPay webhook in `server.js` was comparing the `x-moonpay-signature` header directly against the `MOONPAY_WEBHOOK_SECRET`. Furthermore, it "failed open" if the secret was missing from environment variables.
**Learning:** Webhook signatures are typically HMAC hashes of the payload, not the secret itself. Direct comparison is both functionally incorrect and insecure. Security-sensitive logic must always fail closed if required credentials or secrets are missing.
**Prevention:** Always implement proper HMAC-SHA256 verification for webhooks using a secure comparison function like `crypto.timingSafeEqual`. Ensure that the absence of a secret results in an error rather than bypassing the security check.

## 2026-06-22 - [HIGH] Misplaced Server-Side Webhook Logic and Secret Placeholders
**Vulnerability:** Redundant server-side webhook handling and signature verification logic were found in the client-side `moonpay-client.js`. This included a placeholder for a sensitive secret key and an insecure verification bypass for development.
**Learning:** Client-side bundles should never contain logic meant for server-side endpoints, especially if it involves HMAC verification or references to secret keys. Including Node.js-specific modules (like `crypto`) in client-side code is also a sign of architectural mismatch.
**Prevention:** Consolidate all webhook processing and signature verification to the server-side. Ensure client-side configuration objects only contain public keys and never include placeholders for sensitive secrets, as these are easily exposed and can be accidentally filled with real credentials.

## 2026-06-24 - [HIGH] Unauthorized Expensive Model Usage via AI Proxy
**Vulnerability:** The AI proxy endpoints for Claude and OpenAI in `proxy.js` were blindly forwarding the entire request body to upstream APIs. This allowed any client to request the most expensive models (e.g., Claude 3 Opus, GPT-4o) and arbitrary parameters, potentially exhausting API quotas and increasing costs.
**Learning:** Proxies that facilitate AI requests must act as gateways that enforce specific usage policies. Relying on clients to provide "safe" models is a security and financial risk.
**Prevention:** Implement strict model whitelisting on the server-side. Explicitly define allowed models and restrict the forwarded payload to a whitelist of known, safe parameters (e.g., `messages`, `system`, `temperature`) to prevent parameter injection and maintain cost control.

## 2026-06-23T00:09:08.077Z - [INFO] SENTINEL
security fix verified

## 2026-06-23T00:27:13.940Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-06-26T22:51:25.064Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-06-29T08:03:02.074Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-06-29T08:49:13.354Z - [INFO] SENTINEL
Running security audit across localStorage and active config...
