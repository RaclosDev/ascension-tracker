package com.ascension.service.ai;

import com.ascension.exception.AiQuotaExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


@Service
public class GeminiQuotaService {

    private static final Logger log = LoggerFactory.getLogger(GeminiQuotaService.class);

    @Value("${app.gemini.quota.user-daily-limit:50}")
    private int userDailyLimit = 50;

    @Value("${app.gemini.quota.global-daily-limit:500}")
    private int globalDailyLimit = 500;

    @Value("${app.gemini.circuit.consecutive-failures-threshold:5}")
    private int consecutiveFailuresThreshold = 5;

    @Value("${app.gemini.circuit.cooldown-ms:30000}")
    private long circuitCooldownMs = 30000L;

    private final GeminiQuotaStore store;

    public GeminiQuotaService(GeminiQuotaStore store) {
        this.store = store;
    }

    public GeminiQuotaStore.Reservation checkAndReserveQuota(String userEmail) {
        try {
            return store.reserve(userEmail, userDailyLimit, globalDailyLimit);
        } catch (AiQuotaExceededException failure) {
            log.warn("Gemini quota/circuit rejected request for {}", com.ascension.util.PiiMasker.maskEmail(userEmail));
            throw failure;
        }
    }

    public void checkQuotaAndCircuit(String userEmail) {
        checkAndReserveQuota(userEmail);
    }

    public void releaseQuota(GeminiQuotaStore.Reservation reservation) {
        store.release(reservation);
    }

    public void recordSuccess(String userEmail) {
        store.success();
    }

    public void recordFailure(Throwable failure) {
        if (isCircuitBreakerFailure(failure)) {
            store.failure(consecutiveFailuresThreshold, circuitCooldownMs);
        }
    }

    private boolean isCircuitBreakerFailure(Throwable t) {
        if (t == null) return false;
        if (t instanceof IllegalArgumentException) {
            return false;
        }
        if (t instanceof com.ascension.exception.ExternalApiException eae) {
            org.springframework.http.HttpStatus status = eae.getStatus();
            if (status == null) return false;
            return status.is5xxServerError() || status == org.springframework.http.HttpStatus.TOO_MANY_REQUESTS
                    || status == org.springframework.http.HttpStatus.GATEWAY_TIMEOUT
                    || status == org.springframework.http.HttpStatus.REQUEST_TIMEOUT;
        }
        if (t instanceof org.springframework.web.client.ResourceAccessException) {
            return true;
        }
        if (t instanceof java.util.concurrent.TimeoutException || t instanceof java.io.InterruptedIOException) {
            return true;
        }
        if (t.getCause() != null && t.getCause() != t) {
            return isCircuitBreakerFailure(t.getCause());
        }
        return false;
    }

    public void setUserDailyLimit(int limit) {
        this.userDailyLimit = limit;
    }

    public void setGlobalDailyLimit(int limit) {
        this.globalDailyLimit = limit;
    }

    public void setConsecutiveFailuresThreshold(int threshold) {
        this.consecutiveFailuresThreshold = threshold;
    }

    public void setCircuitCooldownMs(long cooldownMs) {
        this.circuitCooldownMs = cooldownMs;
    }

    public int getConsecutiveFailures() {
        return store.failures();
    }

    public boolean isCircuitOpen() {
        return store.isCircuitOpen();
    }
}
