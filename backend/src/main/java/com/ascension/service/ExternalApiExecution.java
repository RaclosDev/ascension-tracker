package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import jakarta.annotation.PreDestroy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Isolates blocking providers and bounds both running and queued work. */
@Component
public class ExternalApiExecution {
    private final ExecutorService food = pool("food-api-", 8, 16);
    private final ExecutorService gemini = pool("gemini-api-", 4, 8);

    private static ExecutorService pool(String prefix, int threads, int queueSize) {
        AtomicInteger sequence = new AtomicInteger();
        return new ThreadPoolExecutor(threads, threads, 0, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(queueSize), task -> {
                    Thread thread = new Thread(task, prefix + sequence.incrementAndGet());
                    thread.setDaemon(true);
                    return thread;
                }, new ThreadPoolExecutor.AbortPolicy());
    }

    public <T> List<Future<T>> search(List<Callable<T>> tasks, long timeoutMs) {
        try {
            return food.invokeAll(tasks, timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw unavailable("Food", ex);
        } catch (RejectedExecutionException ex) {
            throw unavailable("Food", ex);
        }
    }

    public <T> T generate(Callable<T> task, long timeoutMs) {
        Future<T> future;
        try {
            future = gemini.submit(task);
        } catch (RejectedExecutionException ex) {
            throw unavailable("Gemini", ex);
        }
        try {
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            throw new ExternalApiException("Gemini", HttpStatus.GATEWAY_TIMEOUT,
                    "Se ha agotado el plazo de respuesta de Gemini", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw unavailable("Gemini", ex);
        } catch (ExecutionException ex) {
            if (ex.getCause() instanceof RuntimeException runtime) throw runtime;
            throw new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY,
                    "Fallo de comunicación con Gemini", ex.getCause());
        } finally {
            if (!future.isDone()) future.cancel(true);
        }
    }

    private ExternalApiException unavailable(String provider, Exception cause) {
        return new ExternalApiException(provider, HttpStatus.SERVICE_UNAVAILABLE,
                "Servicio externo ocupado o petición interrumpida", cause);
    }

    @PreDestroy
    public void close() {
        food.shutdownNow();
        gemini.shutdownNow();
    }
}
