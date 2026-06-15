## 2026-06-15 - [CRITICAL] Hardcoded Privy App Secret
**Vulnerability:** A hardcoded Privy App Secret was found in `privy-client.js`. This secret was part of the `PRIVY_CONFIG` object and was exposed to the client-side, which is a major security risk.
**Learning:** Privy App Secrets are meant for server-side verification and should never be included in client-side code or repositories. The client-side SDK only requires the App ID.
**Prevention:** Always use environment variables for secrets and ensure they are only accessed in server-side environments. Regularly scan the codebase for hardcoded credentials. Added `.env.example` and untracked `.env` to prevent accidental credential leakage.
