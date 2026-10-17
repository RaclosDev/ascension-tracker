package com.ascension.service.ratelimit;

import java.time.Duration;

/**
 * Core interface for rate limiting request traffic and enforcing token buckets.
 *
 * Default implementation is in-memory via Caffeine + Bucket4j (see {@link InMemoryRateLimiterService}).
 *
 * NOTE FOR DISTRIBUTED DEPLOYMENTS (REDIS / JDBC ADAPTERS):
 * When scaling horizontally across multiple backend instances (e.g. Kubernetes,
 * Heroku multi-dyno, AWS ECS/Fargate), replace or extend this in-memory service with a distributed
 * adapter:
 * 1. Redis Adapter: Use Bucket4j Redis extension (bucket4j-redis with Redisson or Jedis/Lettuce)
 *    to synchronize token buckets across all application instances.
 * 2. JDBC/Database Adapter: Use a relational database table with optimistic/pessimistic locking
 *    or row-level counters if Redis is not part of the infrastructure.
 */
public interface RateLimiterService {

    /**
     * Attempts to consume 1 token for the specified key given a capacity and refill duration.
     *
     * @param key unique bucket identifier (e.g. "login:ip:192.168.1.1" or "write:user:user@example.com")
     * @param capacity maximum token capacity in the bucket
     * @param refillDuration time period to completely refill tokens
     * @return true if token was consumed, false if rate limit was exceeded
     */
    boolean tryConsume(String key, int capacity, Duration refillDuration);

    /**
     * Convenience method to consume 1 token with a 1-minute refill period.
     */
    default boolean tryConsume(String key, int capacity) {
        return tryConsume(key, capacity, Duration.ofMinutes(1));
    }

    /**
     * Resets internal bucket state (useful for test isolation).
     */
    void reset();
}
