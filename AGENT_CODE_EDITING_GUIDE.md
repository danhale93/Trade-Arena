# In-app AI Agent: Code / Settings Editing (Controlled)

## Goal
Allow an AI agent *inside the application* to propose and apply changes to app source code / settings.

## Safety model (required)
1. **Client never writes files directly.**
2. The client sends a high-level edit request to the backend.
3. Backend generates a **unified diff** and runs a strict allow-list policy.
4. Backend applies the diff using `git apply`.
5. Backend runs verification (at minimum: `node -c` syntax checks on touched files).
6. On failure, backend rolls back using `git checkout -- <files>`.
7. Every attempt is recorded to `.agent_audit/<auditId>.json`.

## Policy
- Default allow-listed files:
  - `server.js`, `contract-helpers.js`, `app.js`, `trading-engine.js`, `music-player.js`
- Client must specify `scopes`.
- The agent must not touch secrets:
  - `.env`, `.blackboxrules`, anything containing `PRIVATE_KEY`, `API_KEY`.

## How to call the workflow
### 1) Plan (diff preview, no changes)
`POST /api/agent/edit/plan`
```json
{
  "request": "Increase riskMultiplier for Conservative bots from 0.5 to 0.75",
  "scopes": ["server.js", "contract-helpers.js"]
}
```

Response includes:
- `auditId`
- `diffPreview`
- `policyStatus`

### 2) Apply (apply diff, verify, audit)
`POST /api/agent/edit/apply`
```json
{
  "auditId": "<auditId>",
  "requestHash": "<requestHash>",
  "diff": "<unified diff text>",
  "scopes": ["server.js"]
}
```

### 3) Audit log
`GET /api/agent/edit/audit/<auditId>`

## Notes / Implementation work left
- `agent-code-edit-runner.js` currently stubs the LLM diff generation.
  - Replace `generateDiffFromLLM()` with your LLM provider call.
- The UI panel depends on `index.html` content; backend endpoints work independently.

