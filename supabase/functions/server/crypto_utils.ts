/** Constant-time string comparison to prevent timing side-channel attacks on sensitive hashes/tokens. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aLen = a.length;
  const bLen = b.length;
  let diff = aLen ^ bLen;
  for (let i = 0; i < aLen; i++) {
    diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % bLen) || 0);
  }
  return diff === 0;
}
