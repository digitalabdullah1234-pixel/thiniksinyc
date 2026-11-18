/** An IPv4 or IPv6 address, and nothing longer: the value becomes a key kept in memory. */
const IP = /^[0-9a-fA-F:.]{3,45}$/;

/**
 * The visitor's address, for rate limits. Behind Cloudflare that is
 * CF-Connecting-IP: the tunnel reaches the server from the server itself, so
 * X-Real-IP is the same for every visitor there. Without Cloudflare, only
 * what the server in front of the app writes itself is trusted: X-Real-IP,
 * else the last X-Forwarded-For entry (earlier entries are whatever the
 * client sent). The server must be reachable through Cloudflare only (no
 * open ports 80/443), or a visitor could write CF-Connecting-IP himself; the
 * limits for all addresses together hold either way.
 */
export function clientIp(h: Headers) {
  const candidates = [h.get("cf-connecting-ip"), h.get("x-real-ip"), h.get("x-forwarded-for")?.split(",").pop()];
  for (const value of candidates) {
    const ip = value?.trim();
    if (ip && IP.test(ip)) return ip.toLowerCase();
  }
  return "local";
}

/** Calls per key in the current window. One server process, so memory is enough. */
const hits = new Map<string, { count: number; reset: number }>();

/** Counts a call for `key`; false once it has made more than `limit` calls within `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = hits.get(key);
  if (!hit || hit.reset <= now) {
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  hit.count += 1;
  return hit.count <= limit;
}
