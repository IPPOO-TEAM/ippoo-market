## 2026-05-23 - URL Scheme Validation for XSS Prevention
**Vulnerability:** `new URL(s)` in JavaScript/TypeScript accepts `javascript:`, `data:`, and `vbscript:` pseudoprotocols without throwing an exception.
**Learning:** Checking `new URL(s)` without verifying `url.protocol` allows malicious payloads like `javascript:alert(1)` to pass URL validation, leading to potential DOM XSS when rendered in `<a href={url}>`.
**Prevention:** Always check `url.protocol === "http:" || url.protocol === "https:"` when validating user-supplied web URLs.
