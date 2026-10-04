## 2025-05-20 - Insecure Fallback in Cryptographic Salt Generation
**Vulnerability:** The `randomSaltHex` function in `src/app/payments/pin-crypto.ts` used `Math.random()` as a fallback when `crypto.getRandomValues` was missing. `Math.random()` is a pseudo-random number generator (PRNG) and is predictable, which degrades the entropy of salt generated for PBKDF2 PIN hashing.
**Learning:** Fallbacks to non-cryptographic PRNGs in security/crypto utilities can inadvertently expose users to salt predictability and brute-force optimizations.
**Prevention:** Always enforce CSPRNG (`crypto.getRandomValues`) for cryptographic operations and throw an explicit error if a secure CSPRNG is unavailable in the environment.
