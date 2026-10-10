## 2026-05-19 - Constant-time HMAC Admin Token Verification
**Vulnerability:** String comparison (`expected !== sig`) in `verifyAdminToken` was vulnerable to timing side-channel attacks, allowing potential signature forgery by measuring comparison response times byte-by-byte.
**Learning:** Base64URL string comparisons for signatures lead to timing side-channels.
**Prevention:** Always use Web Crypto API's native constant-time signature verification (`crypto.subtle.verify`) when validating HMAC signatures.
