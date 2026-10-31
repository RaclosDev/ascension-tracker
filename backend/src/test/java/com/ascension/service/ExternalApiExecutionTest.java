package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

class ExternalApiExecutionTest {
    @Test
    void overloadedGeminiRejectsWorkInsteadOfGrowingThreadsOrQueue() throws Exception {
        var executor = new ExternalApiExecution();
        var callers = java.util.concurrent.Executors.newFixedThreadPool(20);
        var gate = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var rejected = new CountDownLatch(1);
        var running = new java.util.concurrent.atomic.AtomicInteger();
        var peak = new java.util.concurrent.atomic.AtomicInteger();
        try {
            var requests = new java.util.ArrayList<java.util.concurrent.Future<?>>();
            for (int i = 0; i < 20; i++) {
                requests.add(callers.submit(() -> {
                    gate.await();
                    try {
                        executor.generate(() -> {
                            peak.accumulateAndGet(running.incrementAndGet(), Math::max);
                            try { release.await(); return "ok"; }
                            finally { running.decrementAndGet(); }
                        }, 5000);
                    } catch (ExternalApiException ex) {
                        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
                        rejected.countDown();
                    }
                    return null;
                }));
            }
            gate.countDown();
            assertTrue(rejected.await(3, TimeUnit.SECONDS));
            release.countDown();
            for (var request : requests) request.get(3, TimeUnit.SECONDS);
            assertTrue(peak.get() <= 4);
        } finally {
            release.countDown();
            callers.shutdownNow();
            executor.close();
        }
    }

    @Test
    void timeoutInterruptsRunningGeminiWork() throws Exception {
        var executor = new ExternalApiExecution();
        var interrupted = new CountDownLatch(1);
        try {
            var error = assertThrows(ExternalApiException.class, () -> executor.generate(() -> {
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException ex) { interrupted.countDown(); throw ex; }
                return "unexpected";
            }, 200));
            assertEquals(HttpStatus.GATEWAY_TIMEOUT, error.getStatus());
            assertTrue(interrupted.await(2, TimeUnit.SECONDS));
        } finally { executor.close(); }
    }

    @Test
    void foodTimeoutKeepsCompletedProviderAndCancelsSlowProvider() throws Exception {
        var executor = new ExternalApiExecution();
        var interrupted = new CountDownLatch(1);
        try {
            var results = executor.search(List.of(() -> "fast", () -> {
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException ex) { interrupted.countDown(); throw ex; }
                return "unexpected";
            }), 200);
            assertEquals("fast", results.get(0).get());
            assertTrue(results.get(1).isCancelled());
            assertTrue(interrupted.await(2, TimeUnit.SECONDS));
        } finally { executor.close(); }
    }
}
