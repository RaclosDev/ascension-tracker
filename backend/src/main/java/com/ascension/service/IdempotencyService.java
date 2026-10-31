package com.ascension.service;

import java.nio.charset.StandardCharsets;
import java.util.function.Supplier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class IdempotencyService {
    public record Result(int status, String contentType, byte[] body) {}
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;

    public IdempotencyService(JdbcTemplate jdbc, PlatformTransactionManager manager) {
        this.jdbc = jdbc;
        this.transaction = new TransactionTemplate(manager);
        this.transaction.setTimeout(30);
    }

    public Result execute(String email, String key, String hash, Supplier<Result> operation) {
        return transaction.execute(status -> {
            int claimed = jdbc.update("INSERT INTO idempotent_requests(user_email, request_key, request_hash) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", email, key, hash);
            if (claimed == 0) {
                return jdbc.queryForObject("SELECT request_hash, response_status, content_type, response_body FROM idempotent_requests WHERE user_email = ? AND request_key = ?",
                        (rs, row) -> !hash.equals(rs.getString(1))
                                ? new Result(409, "application/json", "{\"error\":\"Idempotency key reused with different request\"}".getBytes(StandardCharsets.UTF_8))
                                : new Result(rs.getInt(2), rs.getString(3), rs.getBytes(4)), email, key);
            }
            Result result = operation.get();
            if (result.status() >= 400) {
                status.setRollbackOnly();
            } else {
                jdbc.update("UPDATE idempotent_requests SET response_status = ?, content_type = ?, response_body = ? WHERE user_email = ? AND request_key = ?",
                        result.status(), result.contentType(), result.body(), email, key);
            }
            return result;
        });
    }

    @Scheduled(cron = "0 30 3 * * *")
    public void cleanup() {
        jdbc.update("DELETE FROM idempotent_requests WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'");
    }
}
