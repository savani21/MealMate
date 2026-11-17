// Lightweight per-process rate limiter. For multi-instance deployments, use a
// shared store (for example Redis) so limits are consistent across instances.
const buckets = new Map();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanup.unref?.();

function createRateLimiter({ windowMs, max, keyGenerator, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const identity = keyGenerator ? keyGenerator(req) : req.ip;
    const key = String(identity || "unknown");
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({
        success: false,
        message: message || "Too many requests. Please try again later.",
      });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
