## 2025-02-24 - Hashing Local Storage Admin PINs
**Vulnerability:** Plaintext storage of administrative secondary authentication PIN in LocalStorage (`ippoo:admin-pin`).
**Learning:** Initial client-side admin 2FA implementation saved raw PIN strings directly in LocalStorage, making them vulnerable to local credential theft, browser extension inspection, and XSS extraction.
**Prevention:** Always hash sensitive authentication credentials using PBKDF2/SHA-256 with a unique per-device salt before persisting them to local client storage.
