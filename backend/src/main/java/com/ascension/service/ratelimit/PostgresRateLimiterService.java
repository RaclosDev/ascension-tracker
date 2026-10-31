package com.ascension.service.ratelimit;

import com.ascension.model.RefreshToken;
import java.time.Duration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.rate-limit.store", havingValue = "postgres", matchIfMissing = true)
public class PostgresRateLimiterService implements RateLimiterService {
    private final JdbcTemplate jdbc;
    public PostgresRateLimiterService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Override public boolean tryConsume(String key, int capacity, Duration refillDuration) {
        if (capacity <= 0 || refillDuration.isZero() || refillDuration.isNegative())
            throw new IllegalArgumentException("Rate limit capacity and duration must be positive");
        double refill = capacity / (refillDuration.toMillis() / 1000.0);
        return !jdbc.queryForList("""
                INSERT INTO http_rate_limits(bucket_key, tokens, updated_at) VALUES (?, ?, clock_timestamp())
                ON CONFLICT (bucket_key) DO UPDATE SET
                    tokens = LEAST(?, http_rate_limits.tokens + GREATEST(0, EXTRACT(EPOCH FROM (clock_timestamp() - http_rate_limits.updated_at))) * ?) - 1,
                    updated_at = clock_timestamp()
                WHERE LEAST(?, http_rate_limits.tokens + GREATEST(0, EXTRACT(EPOCH FROM (clock_timestamp() - http_rate_limits.updated_at))) * ?) >= 1
                RETURNING bucket_key
                """, String.class, RefreshToken.hashToken(key), capacity - 1.0, capacity, refill, capacity, refill).isEmpty();
    }
    @Override public void reset() { jdbc.update("DELETE FROM http_rate_limits"); }
    @Scheduled(cron = "0 15 * * * *")
    public void cleanup() { jdbc.update("DELETE FROM http_rate_limits WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 day'"); }
}
