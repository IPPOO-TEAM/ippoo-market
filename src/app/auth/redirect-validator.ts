const ALLOWED_REDIRECT_HOSTS = new Set([
  "ippoo.market",
  "www.ippoo.market",
  "localhost",
  "127.0.0.1",
]);

/**
 * Validates whether a redirect URL target is safe against Open Redirect vulnerabilities.
 */
export function isValidRedirectUrl(urlStr: string | undefined | null, requestOrigin?: string | null): string | undefined {
  if (!urlStr || typeof urlStr !== "string") return undefined;
  const trimmed = urlStr.trim();
  if (!trimmed) return undefined;

  // Relative path (e.g. /reset-password)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_REDIRECT_HOSTS.has(host) || host.endsWith(".ippoo.market")) {
      return trimmed;
    }

    if (requestOrigin) {
      try {
        const originUrl = new URL(requestOrigin);
        if (originUrl.hostname.toLowerCase() === host) {
          return trimmed;
        }
      } catch {
        // invalid origin header
      }
    }
  } catch {
    // Malformed URL
  }

  return undefined;
}
