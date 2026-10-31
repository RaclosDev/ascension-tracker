package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import com.ascension.service.ratelimit.PostgresRateLimiterService;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.ArrayList;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class DistributedRateLimitIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Test void instancesShareAtomicQuotaUnderConcurrency() throws Exception {
        var first = new PostgresRateLimiterService(jdbc);
        var second = new PostgresRateLimiterService(jdbc);
        String key = UUID.randomUUID().toString();
        var pool = Executors.newFixedThreadPool(4);
        try {
            var tasks = new ArrayList<java.util.concurrent.Future<Boolean>>();
            for (int i = 0; i < 20; i++) {
                var instance = i % 2 == 0 ? first : second;
                tasks.add(pool.submit(() -> instance.tryConsume(key, 5, Duration.ofHours(1))));
            }
            int accepted = 0;
            for (var task : tasks) if (task.get(10, TimeUnit.SECONDS)) accepted++;
            assertThat(accepted).isEqualTo(5);
            assertThat(new PostgresRateLimiterService(jdbc).tryConsume(key, 5, Duration.ofHours(1))).isFalse();
        } finally { pool.shutdownNow(); }
    }
    @Test void refillsAgainstDatabaseTime() {
        var limiter = new PostgresRateLimiterService(jdbc);
        String key = UUID.randomUUID().toString();
        assertThat(limiter.tryConsume(key, 1, Duration.ofMinutes(1))).isTrue();
        assertThat(limiter.tryConsume(key, 1, Duration.ofMinutes(1))).isFalse();
        jdbc.update("UPDATE http_rate_limits SET updated_at = CURRENT_TIMESTAMP - INTERVAL '2 minutes' WHERE bucket_key = ?", com.ascension.model.RefreshToken.hashToken(key));
        assertThat(limiter.tryConsume(key, 1, Duration.ofMinutes(1))).isTrue();
    }
}
