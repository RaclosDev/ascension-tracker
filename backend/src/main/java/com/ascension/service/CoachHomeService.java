package com.ascension.service;

import com.ascension.dto.CoachHomeDtos.Home;
import com.ascension.dto.CoachHomeDtos.KeyLift;
import com.ascension.dto.CoachHomeDtos.Meet;
import com.ascension.util.Emails;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Training facts for the coach's home, limited to active clients who share their training. */
@Service
@RequiredArgsConstructor
public class CoachHomeService {

    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public Home home(String coachEmail, Instant now) {
        UUID coachId = requireCoachId(coachEmail);
        return new Home(lifts(coachId, now), meets(coachId, now));
    }

    private List<KeyLift> lifts(UUID coachId, Instant now) {
        Timestamp at = Timestamp.from(now);
        return jdbc.query("""
                WITH recent AS (
                    SELECT cc.id AS link_id, u.email, w.id AS workout_id, we.exercise_id, ws.weight, ws.reps,
                           (clock.done AT TIME ZONE cc.review_zone)::date AS day, clock.done,
                           CASE WHEN ws.reps = 1 THEN ws.weight ELSE ws.weight * (1 + ws.reps / 30.0) END AS e1rm
                    FROM coach_clients cc
                    JOIN users u ON u.id = cc.client_user_id
                    JOIN workouts w ON w.user_email = u.email AND w.finished_at IS NOT NULL
                    CROSS JOIN LATERAL (SELECT to_timestamp(CASE WHEN w.finished_at > 100000000000
                        THEN w.finished_at / 1000.0 ELSE w.finished_at END) AS done) clock
                    JOIN workout_exercises we ON we.workout_id = w.id AND we.exercise_id IS NOT NULL
                    JOIN workout_sets ws ON ws.workout_exercise_id = we.id
                    WHERE cc.coach_user_id = ? AND cc.status = 'ACTIVE' AND cc.can_view_training
                      AND ws.completed AND COALESCE(ws.type, '') <> 'warmup'
                      AND ws.weight > 0 AND ws.reps BETWEEN 1 AND 10
                      AND clock.done > ?::timestamptz - INTERVAL '42 days' AND clock.done <= ?::timestamptz
                ), favourite AS (
                    SELECT DISTINCT ON (link_id) link_id, exercise_id
                    FROM (SELECT link_id, exercise_id, COUNT(DISTINCT workout_id) AS sessions, MAX(e1rm) AS best
                          FROM recent GROUP BY link_id, exercise_id) counted
                    ORDER BY link_id, sessions DESC, best DESC, exercise_id
                ), ranked AS (
                    SELECT r.*,
                           MAX(r.e1rm) FILTER (WHERE r.done > ?::timestamptz - INTERVAL '21 days')
                               OVER (PARTITION BY r.link_id) AS late,
                           MAX(r.e1rm) FILTER (WHERE r.done <= ?::timestamptz - INTERVAL '21 days')
                               OVER (PARTITION BY r.link_id) AS early
                    FROM recent r JOIN favourite f ON f.link_id = r.link_id AND f.exercise_id = r.exercise_id
                )
                SELECT DISTINCT ON (r.link_id) r.link_id, r.exercise_id, ce.name AS custom_name, r.workout_id,
                       r.day, r.weight, r.reps, ROUND(r.e1rm, 1) AS e1rm, ROUND(r.late - r.early, 1) AS trend
                FROM ranked r
                LEFT JOIN custom_exercises ce ON ce.id = r.exercise_id AND ce.user_email = r.email
                ORDER BY r.link_id, r.e1rm DESC, r.done DESC, r.workout_id
                """,
                (rs, n) -> new KeyLift(rs.getObject("link_id", UUID.class), rs.getString("exercise_id"),
                        rs.getString("custom_name"), rs.getString("workout_id"), rs.getDate("day").toLocalDate(), rs.getBigDecimal("weight"),
                        rs.getBigDecimal("reps"), rs.getBigDecimal("e1rm"), rs.getBigDecimal("trend")),
                coachId, at, at, at, at);
    }

    private List<Meet> meets(UUID coachId, Instant now) {
        return jdbc.query("""
                SELECT m.id, m.link_id, m.content->>'name' AS name, (m.content->>'date')::date AS day
                FROM coach_powerlifting_meets m
                JOIN coach_clients cc ON cc.id = m.link_id
                JOIN coach_powerlifting_profiles p ON p.link_id = cc.id
                WHERE cc.coach_user_id = ? AND cc.status = 'ACTIVE' AND cc.can_view_training
                  AND COALESCE((p.content->>'enabled')::boolean, false)
                  AND NOT COALESCE((m.content->>'archived')::boolean, false)
                  AND (m.content->>'date')::date >= (?::timestamptz AT TIME ZONE cc.review_zone)::date
                ORDER BY day, m.id
                LIMIT 20
                """,
                (rs, n) -> new Meet(rs.getObject("link_id", UUID.class), rs.getObject("id", UUID.class),
                        rs.getString("name"), rs.getDate("day").toLocalDate()),
                coachId, Timestamp.from(now));
    }

    private UUID requireCoachId(String coachEmail) {
        List<UUID> ids = jdbc.queryForList("""
                SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.email = ?
                """, UUID.class, Emails.normalize(coachEmail));
        if (ids.isEmpty()) {
            throw new SecurityException("User is not a coach");
        }
        return ids.get(0);
    }
}
