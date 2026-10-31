package com.ascension.service.ai;

import com.ascension.exception.AiQuotaExceededException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Repository
public class GeminiQuotaStore {
    public record Reservation(UUID id, LocalDate day) { }
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private final Clock clock;

    @Autowired
    public GeminiQuotaStore(JdbcTemplate jdbc, PlatformTransactionManager manager) {
        this(jdbc, manager, Clock.systemUTC());
    }

    GeminiQuotaStore(JdbcTemplate jdbc, PlatformTransactionManager manager, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.transaction = new TransactionTemplate(manager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public Reservation reserve(String email, int userLimit, int globalLimit) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Usuario de cuota obligatorio");
        String owner = email.trim().toLowerCase(Locale.ROOT);
        return transaction.execute(status -> {
            lock();
            if (isCircuitOpen()) throw new AiQuotaExceededException("El servicio de IA se encuentra temporalmente degradado tras multiples fallos consecutivos.");
            LocalDate day = LocalDate.now(clock);
            jdbc.update("DELETE FROM ai_quota_reservations WHERE quota_day < ?", day.minusDays(7));
            jdbc.update("DELETE FROM ai_quota_usage WHERE quota_day < ?", day.minusDays(7));
            jdbc.update("DELETE FROM ai_quota_global WHERE quota_day < ?", day.minusDays(7));
            jdbc.update("INSERT INTO ai_quota_global(quota_day, used) VALUES (?, 0) ON CONFLICT DO NOTHING", day);
            ensureUsage(day, owner);
            if (jdbc.queryForObject("SELECT used FROM ai_quota_global WHERE quota_day = ?", Integer.class, day) >= globalLimit) throw new AiQuotaExceededException("Se ha alcanzado el limite diario global del servicio de IA.");
            if (usage(day, owner) >= userLimit) throw new AiQuotaExceededException("Has alcanzado tu limite diario de consultas de IA.");
            jdbc.update("UPDATE ai_quota_global SET used = used + 1 WHERE quota_day = ?", day);
            jdbc.update("UPDATE ai_quota_usage SET used = used + 1 WHERE quota_day = ? AND user_email = ?", day, owner);
            Reservation reservation = new Reservation(UUID.randomUUID(), day);
            jdbc.update("INSERT INTO ai_quota_reservations(id, quota_day, user_email) VALUES (?, ?, ?)", reservation.id(), day, owner);
            return reservation;
        });
    }

    public void release(Reservation reservation) {
        if (reservation == null) return;
        transaction.executeWithoutResult(status -> {
            lock();
            // Deleting the token makes refunds idempotent across instances and retries.
            jdbc.query("DELETE FROM ai_quota_reservations WHERE id = ? RETURNING quota_day, user_email", result -> {
                LocalDate day = result.getObject(1, LocalDate.class);
                String owner = result.getString(2);
                jdbc.update("UPDATE ai_quota_global SET used = GREATEST(0, used - 1) WHERE quota_day = ?", day);
                jdbc.update("UPDATE ai_quota_usage SET used = GREATEST(0, used - 1) WHERE quota_day = ? AND user_email = ?", day, owner);
            }, reservation.id());
        });
    }

    public void success() {
        transaction.executeWithoutResult(status -> {
            lock();
            jdbc.update("UPDATE ai_circuit_state SET failures = 0, open_until_ms = 0 WHERE id = 1");
        });
    }

    public void failure(int threshold, long cooldownMs) {
        transaction.executeWithoutResult(status -> {
            lock();
            jdbc.update("UPDATE ai_circuit_state SET failures = LEAST(failures + 1, 1000000), " +
                    "open_until_ms = CASE WHEN failures + 1 >= ? THEN ? ELSE open_until_ms END WHERE id = 1",
                    threshold, clock.millis() + cooldownMs);
        });
    }

    public int failures() {
        return jdbc.queryForObject("SELECT failures FROM ai_circuit_state WHERE id = 1", Integer.class);
    }

    public boolean isCircuitOpen() {
        return jdbc.queryForObject("SELECT open_until_ms FROM ai_circuit_state WHERE id = 1", Long.class) > clock.millis();
    }

    private void ensureUsage(LocalDate day, String owner) {
        jdbc.update("INSERT INTO ai_quota_usage(quota_day, user_email, used) VALUES (?, ?, 0) ON CONFLICT DO NOTHING", day, owner);
    }

    private int usage(LocalDate day, String owner) {
        return jdbc.queryForObject("SELECT used FROM ai_quota_usage WHERE quota_day = ? AND user_email = ?", Integer.class, day, owner);
    }

    private void lock() {
        jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtext('ascension_gemini_quota'))", Object.class);
    }
}
