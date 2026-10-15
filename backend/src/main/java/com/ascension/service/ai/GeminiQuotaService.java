package com.ascension.service.ai;

import com.ascension.exception.AiQuotaExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

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

    private volatile LocalDate currentTrackingDate = LocalDate.now();
    private final ConcurrentHashMap<String, AtomicInteger> userDailyUsage = new ConcurrentHashMap<>();
    private final AtomicInteger globalDailyUsage = new AtomicInteger(0);

    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private volatile long circuitOpenUntil = 0L;

    public void checkQuotaAndCircuit(String userEmail) {
        long now = System.currentTimeMillis();
        if (now < circuitOpenUntil) {
            long remainingSec = (circuitOpenUntil - now) / 1000;
            log.warn("Gemini circuit breaker OPEN, rejecting call fast. Remaining cooldown: {}s", remainingSec);
            throw new AiQuotaExceededException("El servicio de IA se encuentra temporalmente degradado tras múltiples fallos consecutivos. Inténtalo de nuevo en unos momentos.");
        }

        checkAndResetDailyQuotas();

        int globalCount = globalDailyUsage.get();
        if (globalCount >= globalDailyLimit) {
            log.warn("Global Gemini daily quota reached: {}/{}", globalCount, globalDailyLimit);
            throw new AiQuotaExceededException("Se ha alcanzado el límite diario global del servicio de IA (" + globalDailyLimit + "). Inténtalo de nuevo mañana.");
        }

        if (userEmail != null && !userEmail.isBlank()) {
            AtomicInteger userCount = userDailyUsage.computeIfAbsent(userEmail, k -> new AtomicInteger(0));
            if (userCount.get() >= userDailyLimit) {
                log.warn("User {} reached daily Gemini quota: {}/{}", userEmail, userCount.get(), userDailyLimit);
                throw new AiQuotaExceededException("Has alcanzado tu límite diario de consultas de IA (" + userDailyLimit + "). Inténtalo de nuevo mañana.");
            }
        }
    }

    public void recordSuccess(String userEmail) {
        checkAndResetDailyQuotas();
        globalDailyUsage.incrementAndGet();
        if (userEmail != null && !userEmail.isBlank()) {
            userDailyUsage.computeIfAbsent(userEmail, k -> new AtomicInteger(0)).incrementAndGet();
        }
        consecutiveFailures.set(0);
        circuitOpenUntil = 0L;
    }

    public void recordFailure(Throwable t) {
        int failures = consecutiveFailures.incrementAndGet();
        log.warn("Gemini call failed (consecutive: {}): {}", failures, t.getMessage());
        if (failures >= consecutiveFailuresThreshold) {
            circuitOpenUntil = System.currentTimeMillis() + circuitCooldownMs;
            log.error("Gemini Circuit Breaker TRIPPED OPEN for {}ms after {} consecutive failures", circuitCooldownMs, failures);
        }
    }

    private synchronized void checkAndResetDailyQuotas() {
        LocalDate today = LocalDate.now();
        if (!today.equals(currentTrackingDate)) {
            userDailyUsage.clear();
            globalDailyUsage.set(0);
            currentTrackingDate = today;
        }
    }

    // Testing and configuration helpers
    public void resetForTesting() {
        userDailyUsage.clear();
        globalDailyUsage.set(0);
        consecutiveFailures.set(0);
        circuitOpenUntil = 0L;
        currentTrackingDate = LocalDate.now();
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
        return consecutiveFailures.get();
    }

    public boolean isCircuitOpen() {
        return System.currentTimeMillis() < circuitOpenUntil;
    }
}
