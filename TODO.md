# TODO - In-app AI agent for code/settings edits

## Plan steps
- [x] 1) Add backend endpoints: /api/agent/edit/plan, /api/agent/edit/apply, /api/agent/edit/audit/:id

- [x] 2) Implement server-side agent edit runner module (LLM->diff->policy->git apply->verification->audit)

- [x] 3) Add strict policy/scope checks + secret redaction


- [ ] 4) Verify verification/rollback behavior (plan-only first)
- [ ] 5) UI integration: detect control panel presence in index.html; if present add panel
- [ ] 6) Smoke test: start server, call /api/health, run plan-only request, then apply a trivial safe change
- [x] 7) Add documentation: AGENT_CODE_EDITING_GUIDE.md


