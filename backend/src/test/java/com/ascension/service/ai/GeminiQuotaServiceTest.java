package com.ascension.service.ai;

import com.ascension.exception.AiQuotaExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GeminiQuotaServiceTest {

    private GeminiQuotaService quotaService;

    @BeforeEach
    void setUp() {
        quotaService = new GeminiQuotaService();
        quotaService.setUserDailyLimit(2);
        quotaService.setGlobalDailyLimit(5);
        quotaService.setConsecutiveFailuresThreshold(5);
        quotaService.setCircuitCooldownMs(5000L);
        quotaService.resetForTesting();
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
        quotaService.checkAndReserveQuota("user@example.com");
        quotaService.checkAndReserveQuota("user@example.com");

        // Limit reached
        assertThrows(AiQuotaExceededException.class, () -> quotaService.checkQuotaAndCircuit("user@example.com"));

        // Release one slot
        quotaService.releaseQuota("user@example.com");

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
