package com.ascension.service;

import com.ascension.dto.ConsentDtos.Answer;
import com.ascension.dto.ConsentDtos.Change;
import com.ascension.dto.ConsentDtos.Kind;
import com.ascension.dto.ConsentDtos.Status;
import com.ascension.exception.InvalidInputException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Consents are stored as an append-only history; the latest row per kind is the one in force.
 * The server stamps its own version of the legal texts, never one sent by the client.
 */
@Service
public class ConsentService {

    /** Kinds a user answers from the app; COACH_TERMS is recorded when coach mode is turned on. */
    private static final Set<Kind> USER_KINDS = Set.of(Kind.TERMS, Kind.PRIVACY, Kind.HEALTH_DATA, Kind.AI_HEALTH);
    /** Withdrawing these means leaving the service, which is done by deleting the account. */
    private static final Set<Kind> REQUIRED = Set.of(Kind.TERMS, Kind.PRIVACY);

    private final JdbcTemplate jdbcTemplate;
    private final String version;

    public ConsentService(JdbcTemplate jdbcTemplate, @Value("${app.legal.version:2026-11-borrador}") String version) {
        this.jdbcTemplate = jdbcTemplate;
        this.version = version;
    }

    public Status status(String email) {
        Map<Kind, Answer> answers = new EnumMap<>(Kind.class);
        jdbcTemplate.query("""
                SELECT DISTINCT ON (c.kind) c.kind, c.granted, c.version, c.created_at
                FROM user_consents c JOIN users u ON u.id = c.user_id
                WHERE u.email = ?
                ORDER BY c.kind, c.created_at DESC, c.id
                """, rs -> {
            answers.put(Kind.valueOf(rs.getString("kind")), new Answer(rs.getBoolean("granted"),
                    rs.getString("version"), rs.getTimestamp("created_at").toInstant()));
        }, normalize(email));
        return new Status(version, answers);
    }

    @Transactional
    public Status record(String email, List<Change> changes) {
        for (Change change : changes) {
            if (!USER_KINDS.contains(change.kind())) {
                throw new InvalidInputException("Ese consentimiento no se puede cambiar desde aquí.");
            }
            if (REQUIRED.contains(change.kind()) && !change.granted()) {
                throw new InvalidInputException(
                        "Para dejar de aceptar los términos o la privacidad, borra tu cuenta desde Ajustes.");
            }
        }
        for (Change change : changes) {
            insert(email, change.kind(), change.granted());
        }
        return status(email);
    }

    public void grant(String email, Kind kind) {
        insert(email, kind, true);
    }

    /** True when the latest answer for {@code kind} is a yes, whatever version it was given on. */
    public boolean isGranted(String email, Kind kind) {
        Boolean granted = jdbcTemplate.query("""
                SELECT c.granted FROM user_consents c JOIN users u ON u.id = c.user_id
                WHERE u.email = ? AND c.kind = ?
                ORDER BY c.created_at DESC, c.id LIMIT 1
                """, rs -> rs.next() ? rs.getBoolean(1) : null, normalize(email), kind.name());
        return Boolean.TRUE.equals(granted);
    }

    private void insert(String email, Kind kind, boolean granted) {
        int rows = jdbcTemplate.update("""
                INSERT INTO user_consents (user_id, kind, version, granted)
                SELECT id, ?, ?, ? FROM users WHERE email = ?
                """, kind.name(), version, granted, normalize(email));
        if (rows != 1) {
            throw new IllegalStateException("No user row for consent");
        }
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
