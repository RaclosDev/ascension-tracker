package com.ascension.service.ai;

import com.ascension.exception.AiQuotaExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@org.springframework.boot.test.context.SpringBootTest
@com.ascension.support.DisabledIfDockerUnavailable
@org.springframework.context.annotation.Import(com.ascension.TestcontainersConfiguration.class)
class GeminiQuotaServiceTest {
    @org.springframework.beans.factory.annotation.Autowired GeminiQuotaStore store;
    @org.springframework.beans.factory.annotation.Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @org.springframework.beans.factory.annotation.Autowired org.springframework.transaction.PlatformTransactionManager manager;

    @org.springframework.beans.factory.annotation.Autowired com.ascension.service.UserService users;
    private GeminiQuotaService quotaService;

    @Test
    void emailRenameKeepsUsageAndOutstandingRefundOwnership() {
        String subject = java.util.UUID.randomUUID().toString();
        String oldEmail = subject+"@old.test";
        String newEmail = subject+"@new.test";
        users.ensureUserExists(oldEmail, "Rename", null, subject);
        var reservation = quotaService.checkAndReserveQuota(oldEmail);
        quotaService.checkAndReserveQuota(oldEmail);
        assertThat(users.changeEmail(subject, oldEmail, newEmail)).isTrue();
        assertThrows(AiQuotaExceededException.class, () -> quotaService.checkAndReserveQuota(newEmail));
        quotaService.releaseQuota(reservation);
        assertDoesNotThrow(() -> quotaService.checkAndReserveQuota(newEmail));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ai_quota_usage WHERE user_email=?", Integer.class, oldEmail)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ai_quota_reservations WHERE user_email=?", Integer.class, oldEmail)).isZero();
        jdbc.update("DELETE FROM users WHERE email=?", newEmail);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ai_quota_usage WHERE user_email=?", Integer.class, newEmail)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ai_quota_reservations WHERE user_email=?", Integer.class, newEmail)).isZero();
    }

    @Test
    void concurrentInstancesCannotOverbookTheUserQuota() throws Exception {
        var pool = java.util.concurrent.Executors.newFixedThreadPool(6);
        try {
            var tasks = java.util.stream.IntStream.range(0, 12).mapToObj(i -> (java.util.concurrent.Callable<Boolean>) () -> {
                var instance = new GeminiQuotaService(new GeminiQuotaStore(jdbc, manager));
                instance.setUserDailyLimit(2);
                try {
                    instance.checkAndReserveQuota("shared@example.com");
                    return true;
                } catch (AiQuotaExceededException expected) {
                    return false;
                }
            }).toList();
            int admitted = 0;
            for (var result : pool.invokeAll(tasks, 10, java.util.concurrent.TimeUnit.SECONDS)) {
                if (result.get()) admitted++;
            }
            assertThat(admitted).isEqualTo(2);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void refundAfterMidnightOnlyReleasesOriginalDayAndOnlyOnce() {
        var yesterday = new GeminiQuotaStore(jdbc, manager, java.time.Clock.fixed(
                java.time.Instant.parse("2026-10-30T23:59:59Z"), java.time.ZoneOffset.UTC));
        var today = new GeminiQuotaStore(jdbc, manager, java.time.Clock.fixed(
                java.time.Instant.parse("2026-10-31T00:00:01Z"), java.time.ZoneOffset.UTC));
        var oldReservation = yesterday.reserve("midnight@example.com", 1, 1);
        today.reserve("midnight@example.com", 1, 1);
        today.release(oldReservation);
        today.release(oldReservation);
        assertThrows(AiQuotaExceededException.class, () -> today.reserve("midnight@example.com", 1, 1));
        assertThat(jdbc.queryForObject("SELECT used FROM ai_quota_global WHERE quota_day = DATE '2026-10-30'", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT used FROM ai_quota_global WHERE quota_day = DATE '2026-10-31'", Integer.class)).isEqualTo(1);
    }

    @Test
    void circuitStateSurvivesCreatingAnotherServiceInstance() {
        quotaService.setConsecutiveFailuresThreshold(1);
        quotaService.recordFailure(new org.springframework.web.client.ResourceAccessException("timeout"));
        var other = new GeminiQuotaService(store);
        assertThat(other.isCircuitOpen()).isTrue();
        assertThrows(AiQuotaExceededException.class, () -> other.checkAndReserveQuota("user@example.com"));
    }

    @Test
    void twoInstancesShareTheSameDailyLimit() {
        quotaService.checkAndReserveQuota("shared@example.com");
        quotaService.checkAndReserveQuota("shared@example.com");
        var otherInstance = new GeminiQuotaService(store);
        otherInstance.setUserDailyLimit(2);
        assertThrows(AiQuotaExceededException.class, () -> otherInstance.checkAndReserveQuota("shared@example.com"));
    }

    @BeforeEach
    void setUp() {
        quotaService = new GeminiQuotaService(store);
        quotaService.setUserDailyLimit(2);
        quotaService.setGlobalDailyLimit(5);
        quotaService.setConsecutiveFailuresThreshold(5);
        quotaService.setCircuitCooldownMs(5000L);
        jdbc.update("DELETE FROM ai_quota_reservations");
        jdbc.update("DELETE FROM ai_quota_usage");
        jdbc.update("DELETE FROM ai_quota_global");
        for (String email : java.util.List.of("user@example.com", "shared@example.com", "midnight@example.com", "another_user@example.com",
                "user0@example.com", "user1@example.com", "user2@example.com", "user3@example.com", "user4@example.com")) {
            users.ensureUserExists(email, "Quota", null);
        }
        jdbc.update("UPDATE ai_circuit_state SET failures = 0, open_until_ms = 0 WHERE id = 1");
    }

    @Test
    void checkQuota_WhenUnderLimit_DoesNotThrow() {
        assertDoesNotThrow(() -> quotaService.checkQuotaAndCircuit("user@example.com"));
    }

    @Test
    void checkQuota_WhenUserReachesDailyLimit_ThrowsAiQuotaExceededException() {
        quotaService.checkAndReserveQuota("user@example.com");
        quotaService.checkAndReserveQuota("user@example.com");

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("user@example.com")
        );

        assertThat(ex.getMessage()).contains("limite diario");
    }

    @Test
    void releaseQuota_RefundsUserAndGlobalSlotsOnUpstreamFailure() {
        var reservation = quotaService.checkAndReserveQuota("user@example.com");
        quotaService.checkAndReserveQuota("user@example.com");

        // Limit reached
        assertThrows(AiQuotaExceededException.class, () -> quotaService.checkQuotaAndCircuit("user@example.com"));

        // Release one slot
        quotaService.releaseQuota(reservation);

        // Now can reserve again
        assertDoesNotThrow(() -> quotaService.checkAndReserveQuota("user@example.com"));
    }

    @Test
    void checkQuota_WhenGlobalLimitReached_ThrowsAiQuotaExceededException() {
        quotaService.setUserDailyLimit(100);
        for (int i = 0; i < 5; i++) {
            quotaService.checkAndReserveQuota("user" + i + "@example.com");
        }

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("another_user@example.com")
        );

        assertThat(ex.getMessage()).contains("limite diario global");
    }

    @Test
    void circuitBreaker_IgnoresClientValidationAnd4xxErrors() {
        // Client validation error
        for (int i = 0; i < 5; i++) {
            quotaService.recordFailure(new IllegalArgumentException("Invalid base64 image or bad dimension"));
        }
        // Client 4xx error from upstream Gemini (e.g. 400 Bad Request, 422 Unprocessable)
        for (int i = 0; i < 5; i++) {
            quotaService.recordFailure(new com.ascension.exception.ExternalApiException("Gemini", org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid prompt format"));
        }
        assertThat(quotaService.getConsecutiveFailures()).isEqualTo(0);
        assertThat(quotaService.isCircuitOpen()).isFalse();
    }

    @Test
    void circuitBreaker_TripsOpenAfterConsecutiveUpstreamFailuresAndRejectsFast() {
        for (int i = 0; i < 4; i++) {
            quotaService.recordFailure(new com.ascension.exception.ExternalApiException("Gemini", org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "503 overload"));
            assertThat(quotaService.isCircuitOpen()).isFalse();
        }

        // 5th consecutive 5xx failure trips circuit breaker
        quotaService.recordFailure(new com.ascension.exception.ExternalApiException("Gemini", org.springframework.http.HttpStatus.BAD_GATEWAY, "502 Bad Gateway"));
        assertThat(quotaService.isCircuitOpen()).isTrue();

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("user@example.com")
        );
        assertThat(ex.getMessage()).contains("multiples fallos consecutivos");
    }

    @Test
    void circuitBreaker_TripsOpenOnRateLimitsAndNetworkTimeouts() {
        for (int i = 0; i < 4; i++) {
            quotaService.recordFailure(new com.ascension.exception.ExternalApiException("Gemini", org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "429 Rate Limit"));
        }
        quotaService.recordFailure(new org.springframework.web.client.ResourceAccessException("Read timed out"));
        assertThat(quotaService.isCircuitOpen()).isTrue();
    }

    @Test
    void circuitBreaker_RecoversOnSuccess() {
        for (int i = 0; i < 3; i++) {
            quotaService.recordFailure(new com.ascension.exception.ExternalApiException("Gemini", org.springframework.http.HttpStatus.BAD_GATEWAY, "502 Bad Gateway"));
        }
        assertThat(quotaService.getConsecutiveFailures()).isEqualTo(3);

        quotaService.recordSuccess("user@example.com");
        assertThat(quotaService.getConsecutiveFailures()).isEqualTo(0);
        assertThat(quotaService.isCircuitOpen()).isFalse();
    }
}
