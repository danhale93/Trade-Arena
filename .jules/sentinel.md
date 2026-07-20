# Sentinel Security Journal

## 2026-07-06 - Express Security Hardening
**Vulnerability:** Information disclosure via `X-Powered-By` header and potential rate-limiting bypass/DoS due to missing `trust proxy` setting.
**Learning:** Default Express configurations often leak server technology details and fail to correctly identify client IPs behind proxies, which can cripple rate-limiting defenses.
**Prevention:** Always disable `x-powered-by`, set `trust proxy` when behind a load balancer, and use strict `Referrer-Policy` to prevent URL leakage.

## 2026-07-07T07:02:45.791Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:02:49.783Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:13:47.848Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:13:51.850Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:15:25.912Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:15:29.898Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:20:09.241Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:20:13.242Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:21:10.912Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:21:14.906Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:24:50.817Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:24:54.801Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:26:32.414Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:26:36.398Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T07:32:55.477Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T07:32:59.461Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-07T08:37:43.955Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-07T08:37:47.936Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-10T22:48:28.801Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-10T22:48:32.803Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-12T05:40:36.871Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-12T05:40:40.850Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-12T23:39:22.827Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-12T23:39:26.810Z - [SUCCESS] SENTINEL
Security audit complete. All encryption layers intact.

## 2026-07-12T23:40:07.923Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-13T05:43:34.897Z - [INFO] SENTINEL
Running security audit across localStorage and active config...

## 2026-07-13 - Security Hardening & Proxy Alignment
**Vulnerability:** Information disclosure in `proxy.js` (X-Powered-By) and potential timing attacks on reward claim validation tokens. Gemini API key leakage in URL query parameters.
**Learning:** Secondary proxy servers often lag behind main servers in security posture. Sensitive validation tokens compared with `!==` are vulnerable to timing-based side-channel attacks.
**Prevention:** Align security headers across all entry points. Use `crypto.timingSafeEqual` for all secret/token comparisons. Prefer header-based authentication for third-party AI APIs (like Gemini) over URL parameters.

## 2026-07-16 - Directory Traversal and Arbitrary Overwrite Hardening
**Vulnerability:** Directory traversal and arbitrary file write / overwrite vulnerability in `/api/maintenance/patch` endpoint of `proxy.js`.
**Learning:** General path verification using `resolvedPath.startsWith(rootPath)` is insufficient if it permits overwriting any repository-internal code (such as configuration files or backend source code), allowing unauthorized modifications or remote code execution.
**Prevention:** Implement strict absolute file whitelists (`ALLOWED_PATCH_FILES`) to heavily restrict the target subset of mutable files on any dynamic update endpoints, preventing general directory structure manipulation.

## 2026-07-17 - Referrer Header Information Leakage & Dependency Loading Alignment
**Vulnerability:** Information leakage via the referrer header in `proxy.js` requests and potential service outage due to duplicate variable declarations crashing the express server.
**Learning:** Even if main application servers are fully hardened, secondary proxies or service runners may lack identical headers (such as `Referrer-Policy`). Additionally, duplicate declaration in module scope crashes startup, completely disabling rate limiting defenses.
**Prevention:** Keep middleware security configurations synchronized across both primary servers and proxies. Always verify syntax using `node -c` or local start before deployment, and ensure `Referrer-Policy` is explicitly set to `no-referrer` to prevent URL context leakage.

## 2026-07-18 - Type-Confusion and Crash-based DoS in Cryptographic Validation
**Vulnerability:** Type confusion when validating incoming request parameters (such as `validationToken` and `userId`) allowing non-string or array-like values to bypass string checks, causing unhandled `TypeError` exceptions inside `Buffer.from()` and crashing the request/server thread.
**Learning:** Simple existence checks (e.g. `validationToken && ...`) are insufficient when cryptographic or payload functions assume a string. Passing non-string objects to native Node.js/V8 APIs can crash the handler and leak system internal state or cause localized Denial of Service.
**Prevention:** Always enforce strict `typeof` verification for sensitive values or token inputs prior to passing them to functions that expect string-like inputs (such as `crypto.timingSafeEqual`, `Buffer.from`, or Object prototype property lookups).

## 2026-07-19 - Malformed Input Type and Address Format Validation Bypasses
**Vulnerability:** Lack of format and type-safety check for critical input parameters (`userAddress`, `taskId`, and `reward`) on task and faucet claim endpoints, allowing non-string values, malformed non-finite values (like `NaN` or `Infinity`), or invalid addresses to trigger downstream transaction signing or throw unhandled 500 exceptions.
**Learning:** Validating parameter existence or simple equality checks is insufficient when numeric or address logic is computed downstream. Non-finite values such as `NaN` can break inequality checks, while invalid Ethereum address formats will crash client calls inside ethers.js helpers.
**Prevention:** Always enforce strict type checks, finite range constraints for numbers, and valid format validation (such as `ethers.isAddress`) at the API route controller boundary before performing any business logic or contract invocations.
