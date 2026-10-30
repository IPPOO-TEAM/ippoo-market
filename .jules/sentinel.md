## 2026-05-18 - Constant-Time String Comparison for Admin Auth
**Vulnerability:** Standard `===` / `!==` equality operators in HMAC token verification and admin password login were vulnerable to timing side-channel attacks because non-constant-time comparisons return early upon finding the first differing character.
**Learning:** String comparisons of tokens, secrets, or passwords must always use constant-time comparison algorithms across server routes and authentication middleware.
**Prevention:** Use `timingSafeEqual` from `src/app/lib/validators.ts` whenever comparing hashes, tokens, or plaintext passwords on the server.
