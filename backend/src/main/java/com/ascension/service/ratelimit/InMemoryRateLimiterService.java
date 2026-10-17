package com.ascension.service.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * In-memory token bucket rate limiter implementation backed by Caffeine and Bucket4j.
 * Suitable for standalone instances or single-container deployments.
 */
@Service
public class InMemoryRateLimiterService implements RateLimiterService {

    private final Cache<String, Bucket> requestBuckets = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(1, TimeUnit.HOURS)
            .build();

    @Override
    public boolean tryConsume(String key, int capacity, Duration refillDuration) {
        Bucket bucket = requestBuckets.get(key, k -> createNewBucket(capacity, refillDuration));
        return bucket != null && bucket.tryConsume(1);
    }

    private Bucket createNewBucket(int capacity, Duration refillDuration) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, refillDuration)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    public void reset() {
        requestBuckets.invalidateAll();
    }
}
