package com.ascension.service;

import com.ascension.util.AppClock;
import com.ascension.dto.CoachDtos.DayComment;
import com.ascension.dto.CoachDtos.DayCommentExport;
import com.ascension.dto.CoachDtos.Person;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import com.ascension.util.Emails;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * The coach's comment on one day of an athlete's week, with or without a workout that day. Every
 * read and write is scoped to one link: the coach's through the resolved {@link ClientAccess}, the
 * athlete's through their own email on that link.
 */
@Service
public class CoachDayCommentService {

    private static final int MAX_RANGE_DAYS = 62;

    private final JdbcTemplate jdbcTemplate;

    public CoachDayCommentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<DayComment> list(ClientAccess access, LocalDate from, LocalDate to) {
        requireRange(from, to);
        return jdbcTemplate.query("""
                SELECT day, body, updated_at FROM coach_day_comments
                WHERE coach_client_id = ? AND day BETWEEN ? AND ? ORDER BY day
                """, (rs, n) -> new DayComment(rs.getObject("day", LocalDate.class), rs.getString("body"),
                instant(rs.getTimestamp("updated_at"))), access.linkId(), from, to);
    }

    @Transactional
    public void save(ClientAccess access, LocalDate day, String text) {
        // One day of slack: the coach's local date may be ahead of the server's.
        if (day.isAfter(AppClock.today().plusDays(1))) {
            throw new InvalidInputException("No se puede comentar un día que aún no ha llegado");
        }
        jdbcTemplate.update("""
                INSERT INTO coach_day_comments (coach_client_id, day, body) VALUES (?, ?, ?)
                ON CONFLICT (coach_client_id, day) DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()
                """, access.linkId(), day, text.strip());
    }

    @Transactional
    public void delete(ClientAccess access, LocalDate day) {
        jdbcTemplate.update("DELETE FROM coach_day_comments WHERE coach_client_id = ? AND day = ?",
                access.linkId(), day);
    }

    /** What one coach said about the caller's days; empty when the link is not the caller's. */
    @Transactional(readOnly = true)
    public List<DayComment> forClient(String clientEmail, UUID linkId, LocalDate from, LocalDate to) {
        requireRange(from, to);
        return jdbcTemplate.query("""
                SELECT c.day, c.body, c.updated_at
                FROM coach_day_comments c
                JOIN coach_clients cc ON cc.id = c.coach_client_id
                JOIN users cu ON cu.id = cc.client_user_id
                WHERE cc.id = ? AND cu.email = ? AND c.day BETWEEN ? AND ?
                ORDER BY c.day
                """, (rs, n) -> new DayComment(rs.getObject("day", LocalDate.class), rs.getString("body"),
                instant(rs.getTimestamp("updated_at"))), linkId, Emails.normalizeRequired(clientEmail), from, to);
    }

    /** Every day comment the user wrote as a coach or received as an athlete. */
    @Transactional(readOnly = true)
    public List<DayCommentExport> exportFor(UUID userId) {
        return jdbcTemplate.query("""
                SELECT c.id, CASE WHEN cc.coach_user_id = ? THEN 'COACH' ELSE 'CLIENT' END AS role,
                       c.day, c.body, c.created_at, c.updated_at,
                       COALESCE(cp.name, u.name) AS name, u.email,
                       CASE WHEN cp.id IS NULL THEN u.picture ELSE cp.picture END AS picture
                FROM coach_day_comments c
                JOIN coach_clients cc ON cc.id = c.coach_client_id
                JOIN users u ON u.id = CASE WHEN cc.coach_user_id = ? THEN cc.client_user_id ELSE cc.coach_user_id END
                LEFT JOIN coach_public_profiles cp ON cp.id = u.id AND cp.id = cc.coach_user_id
                WHERE cc.coach_user_id = ? OR cc.client_user_id = ?
                ORDER BY c.day, c.created_at
                """, (rs, n) -> new DayCommentExport(rs.getObject("id", UUID.class), rs.getString("role"),
                new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture")),
                rs.getObject("day", LocalDate.class), rs.getString("body"),
                instant(rs.getTimestamp("created_at")), instant(rs.getTimestamp("updated_at"))),
                userId, userId, userId, userId);
    }

    private static void requireRange(LocalDate from, LocalDate to) {
        if (to.isBefore(from) || from.plusDays(MAX_RANGE_DAYS).isBefore(to)) {
            throw new InvalidInputException("El intervalo de fechas no es válido");
        }
    }

    private static Instant instant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
