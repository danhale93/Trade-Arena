# PR: Add Render link, CI, and connectivity tests

This pull request prepares the repository for deployment to Render and adds helpful tests and documentation to validate connectivity and safety.

Files included:
- README.md (updated with live Render URL and run/test/deploy instructions)
- .env.example
- scripts/rpc-check.js
- scripts/fork-test.js
- .github/workflows/ci.yml

Notes:
- CI includes optional jobs for mainnet-fork tests and a manual Render deploy which require secrets to be added in: Settings → Secrets
  - ALCHEMY_MAINNET_URL (or INFURA_MAINNET_URL)
  - RENDER_SERVICE_ID
  - RENDER_API_KEY

- No secrets or private keys are committed.
- The Deploy to Render job is triggered via workflow_dispatch and requires Render API credentials in secrets.

---

Please review the changes and run the fork tests locally or in CI after adding the necessary secrets.

— GitHub Copilot Chat Assistant
