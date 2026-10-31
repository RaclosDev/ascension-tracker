package com.ascension.service.ratelimit;

import java.time.Duration;

/**
 * Token-bucket rate limiter. The default {@link InMemoryRateLimiterService} counts per instance;
 * running several backend instances needs a shared store such as bucket4j-redis or a JDBC table.
 */
public interface RateLimiterService {

    /**
     * @param key bucket identifier, e.g. "login:ip:192.168.1.1" or "write:user:user@example.com"
     * @param refillDuration time to refill the bucket completely
     * @return false when the rate limit is exceeded
     */
    boolean tryConsume(String key, int capacity, Duration refillDuration);

    default boolean tryConsume(String key, int capacity) {
        return tryConsume(key, capacity, Duration.ofMinutes(1));
    }

    /** Clears every bucket; used for test isolation. */
    void reset();
}
