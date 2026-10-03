## 2025-05-18 - Constant-time HMAC signature verification for Admin Tokens
**Vulnerability:** HMAC token verification in `verifyAdminToken` used non-constant-time string comparison (`!==`), creating a timing side-channel attack vector.
**Learning:** Checking string equality for HMAC signatures terminates early on byte mismatches, which can allow an attacker to forge or brute-force signatures via timing analysis.
**Prevention:** Always verify signatures using `crypto.subtle.verify` or timing-safe buffer equality functions (`timingSafeEqual`).
