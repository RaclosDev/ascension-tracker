package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class IdempotencyIntegrationTest {
    @Autowired org.springframework.test.web.servlet.MockMvc mvc;
    @Autowired IdempotencyService service;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    private String user() {
        String email = UUID.randomUUID() + "@idempotency.test";
        users.ensureUserExists(email, "Before", null);
        return email;
    }
    private IdempotencyService.Result response(int status) {
        return new IdempotencyService.Result(status, "application/json", "{\"saved\":true}".getBytes(StandardCharsets.UTF_8));
    }
    @Test void httpRetryReplaysSameResponseAndWritesOneWorkout() throws Exception {
        String email = user();
        String payload = "{\"name\":\"Retry proof\",\"startedAt\":1760000000000,\"finishedAt\":1760000060000,\"durationMs\":60000,\"exercises\":[]}";
        var first = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/workouts")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject(email).claim("email", email)))
                .header("Idempotency-Key", "http-intent").contentType("application/json").content(payload))
                .andReturn().getResponse();
        assertThat(first.getStatus()).isBetween(200, 299);
        var retry = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/workouts")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt().jwt(j -> j.subject(email).claim("email", email)))
                .header("Idempotency-Key", "http-intent").contentType("application/json").content(payload))
                .andReturn().getResponse();
        assertThat(retry.getContentAsString()).isEqualTo(first.getContentAsString());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workouts WHERE user_email = ?", Integer.class, email)).isEqualTo(1);
    }
    @Test void concurrentRetriesRunBusinessWriteExactlyOnceAndReplayResult() throws Exception {
        String email = user();
        AtomicInteger calls = new AtomicInteger();
        CountDownLatch ready = new CountDownLatch(2);
        var pool = Executors.newFixedThreadPool(2);
        try {
            var operation = (java.util.concurrent.Callable<IdempotencyService.Result>) () -> {
                ready.countDown();
                assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
                return service.execute(email, "same-intent", "hash", () -> {
                    calls.incrementAndGet();
                    jdbc.update("UPDATE users SET name = 'After' WHERE email = ?", email);
                    return response(201);
                });
            };
            var one = pool.submit(operation);
            var two = pool.submit(operation);
            assertThat(one.get(10, TimeUnit.SECONDS).body()).isEqualTo(two.get(10, TimeUnit.SECONDS).body());
            assertThat(calls).hasValue(1);
            assertThat(jdbc.queryForObject("SELECT name FROM users WHERE email = ?", String.class, email)).isEqualTo("After");
        } finally { pool.shutdownNow(); }
    }
    @Test void rejectsChangedPayloadAndIsolatesAccounts() {
        String email = user();
        service.execute(email, "intent", "first", () -> response(201));
        var conflict = service.execute(email, "intent", "different", () -> { throw new AssertionError("Must not execute"); });
        assertThat(conflict.status()).isEqualTo(409);
        assertThat(service.execute(user(), "intent", "different", () -> response(201)).status()).isEqualTo(201);
    }
    @Test void rollsBackBusinessWriteAndClaimOnErrorResponse() {
        String email = user();
        service.execute(email, "retryable", "hash", () -> {
            jdbc.update("UPDATE users SET name = 'Wrong' WHERE email = ?", email);
            return response(400);
        });
        assertThat(jdbc.queryForObject("SELECT name FROM users WHERE email = ?", String.class, email)).isEqualTo("Before");
        assertThat(service.execute(email, "retryable", "hash", () -> response(201)).status()).isEqualTo(201);
    }
    @Test void exceptionDoesNotLeaveClaimOrBusinessWrite() {
        String email = user();
        assertThatThrownBy(() -> service.execute(email, "retryable", "hash", () -> {
            jdbc.update("UPDATE users SET name = 'Wrong' WHERE email = ?", email);
            throw new IllegalArgumentException("Failure");
        })).isInstanceOf(IllegalArgumentException.class);
        assertThat(jdbc.queryForObject("SELECT name FROM users WHERE email = ?", String.class, email)).isEqualTo("Before");
        assertThat(service.execute(email, "retryable", "hash", () -> response(201)).status()).isEqualTo(201);
    }
}
