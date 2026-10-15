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
        quotaService.recordSuccess("user@example.com");
        quotaService.recordSuccess("user@example.com");

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("user@example.com")
        );

        assertThat(ex.getMessage()).contains("Has alcanzado tu límite diario");
    }

    @Test
    void checkQuota_WhenGlobalLimitReached_ThrowsAiQuotaExceededException() {
        quotaService.setUserDailyLimit(100);
        for (int i = 0; i < 5; i++) {
            quotaService.recordSuccess("user" + i + "@example.com");
        }

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("another_user@example.com")
        );

        assertThat(ex.getMessage()).contains("Se ha alcanzado el límite diario global");
    }

    @Test
    void circuitBreaker_TripsOpenAfterConsecutiveFailuresAndRejectsFast() {
        for (int i = 0; i < 4; i++) {
            quotaService.recordFailure(new RuntimeException("Transient error " + i));
            assertThat(quotaService.isCircuitOpen()).isFalse();
        }

        // 5th consecutive failure trips circuit breaker
        quotaService.recordFailure(new RuntimeException("Transient error 5"));
        assertThat(quotaService.isCircuitOpen()).isTrue();

        AiQuotaExceededException ex = assertThrows(
                AiQuotaExceededException.class,
                () -> quotaService.checkQuotaAndCircuit("user@example.com")
        );
        assertThat(ex.getMessage()).contains("degradado tras múltiples fallos consecutivos");
    }

    @Test
    void circuitBreaker_RecoversOnSuccess() {
        for (int i = 0; i < 3; i++) {
            quotaService.recordFailure(new RuntimeException("Transient error " + i));
        }
        assertThat(quotaService.getConsecutiveFailures()).isEqualTo(3);

        quotaService.recordSuccess("user@example.com");
        assertThat(quotaService.getConsecutiveFailures()).isEqualTo(0);
        assertThat(quotaService.isCircuitOpen()).isFalse();
    }
}
