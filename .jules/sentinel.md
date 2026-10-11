# Sentinel Security Journal

## 2026-05-19 - Constant-time String Comparison for Cryptographic Verification
**Vulnerability:** Standard string equality (`===` / `!==`) in PIN, HMAC token signature, and password verification introduced timing attack side-channel risks.
**Learning:** In JavaScript runtime engines, default string comparisons fail fast on the first mismatched character, allowing attackers to incrementally deduce secret values based on slight variations in server response times.
**Prevention:** Use `safeCompareStrings` for all hash, token signature, and password comparisons to ensure constant-time execution regardless of input length or character mismatch positions.
