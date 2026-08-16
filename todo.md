# Trade-Arena Settings & Token Vault TODO

- [x] Inspect current settings route and token mutation
- [x] Implement secure settings-page token form with masking and owner validation
- [x] Verify token handling, test suite, and production build check
- [x] Save checkpoint and deliver updated dashboard
# Additional Requirement: Configure Backend CLI Environment

- [x] Inspect existing project secrets and configuration
- [x] Define MM_CLI_TOKEN and MANAGED_WALLET_ADDRESS environment variables securely via backend request_secrets / env config
- [x] Verify environment variable availability in server context without exposing plaintext secrets
- [x] Deliver configuration confirmation and operational boundary notice
# Additional Requirement: Phone Notifications and Mini Live Widget

- [x] Design PWA manifest and service worker support for home-screen shortcut and push notifications
- [x] Implement mini live-ticker widget view mode on the dashboard for compact lock-screen / home-screen viewing
- [x] Connect backend notification helper (`notifyOwner` / Firebase Cloud Messaging Web Push) to alert phone on successful trade settlement
- [x] Provide clear guide on obtaining Google/Firebase Cloud Messaging (FCM) API keys and web push credentials
- [x] Verify build, run test suite, and deliver implementation status
