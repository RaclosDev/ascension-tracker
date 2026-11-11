package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.CoachDtos.Person;
import com.ascension.dto.CoachDtos.WorkoutComment;
import com.ascension.dto.ProgramDtos.Exercise;
import com.ascension.dto.ProgramDtos.Session;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Prescribed versus done: each day of a program a coach assigned, next to the workout the client
 * logged for it, and the coach's comment on that workout. Every read and write is scoped to the
 * resolved {@link ClientAccess}: the assignment must belong to the link, and the workout to its client.
 */
@Service
public class CoachSessionService {

    private final JdbcTemplate jdbcTemplate;

    public CoachSessionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private record DayRow(UUID id, int week, int dayIndex, String name, String notes) {
    }

    private record Done(String id, String name, Long finishedAt, String origin, String comment) {
    }

    @Transactional(readOnly = true)
    public List<Session> sessions(ClientAccess access, UUID assignmentId) {
        List<Map<String, Object>> found = jdbcTemplate.queryForList("""
                SELECT a.program_id, a.start_date FROM program_assignments a
                JOIN programs p ON p.id = a.program_id
                WHERE a.id = ? AND a.coach_link_id = ? AND p.owner_user_id = ?
                """, assignmentId, access.linkId(), access.clientUserId());
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
        UUID programId = (UUID) found.get(0).get("program_id");
        LocalDate firstMonday = ((java.sql.Date) found.get(0).get("start_date")).toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<DayRow> days = jdbcTemplate.query("""
                SELECT id, week, day_index, name, notes FROM program_days
                WHERE program_id = ? ORDER BY week, day_index
                """,
                (rs, n) -> new DayRow(rs.getObject("id", UUID.class), rs.getInt("week"), rs.getInt("day_index"),
                        rs.getString("name"), rs.getString("notes")),
                programId);

        Map<UUID, List<Exercise>> exercises = new LinkedHashMap<>();
        jdbcTemplate.query("""
                SELECT e.* FROM program_exercises e JOIN program_days d ON d.id = e.program_day_id
                WHERE d.program_id = ? ORDER BY e.program_day_id, e.order_index
                """, rs -> {
            exercises.computeIfAbsent(rs.getObject("program_day_id", UUID.class), k -> new ArrayList<>())
                    .add(ProgramService.exercise(rs));
        }, programId);

        // The latest workout logged for each day, with this coach's comment on it.
        Map<UUID, Done> done = new LinkedHashMap<>();
        jdbcTemplate.query("""
                SELECT DISTINCT ON (w.program_day_id) w.program_day_id, w.id, w.name, w.finished_at,
                       w.program_origin, c.body
                FROM workouts w
                JOIN program_days d ON d.id = w.program_day_id
                LEFT JOIN workout_comments c ON c.workout_id = w.id AND c.coach_user_id = ?
                WHERE d.program_id = ? AND w.user_email = ?
                ORDER BY w.program_day_id, w.started_at DESC
                """, rs -> {
            long finishedAt = rs.getLong("finished_at");
            done.put(rs.getObject("program_day_id", UUID.class), new Done(rs.getString("id"), rs.getString("name"),
                    rs.wasNull() ? null : finishedAt, rs.getString("program_origin"), rs.getString("body")));
        }, access.coachUserId(), programId, access.clientEmail());

        return days.stream().map(d -> {
            Done w = done.get(d.id());
            return new Session(d.id(), d.week(), d.dayIndex(),
                    firstMonday.plusWeeks(d.week() - 1L).plusDays(d.dayIndex() - 1L), d.name(), d.notes(),
                    exercises.getOrDefault(d.id(), List.of()),
                    w == null ? null : w.id(), w == null ? null : w.name(), w == null ? null : w.finishedAt(),
                    w == null ? null : w.origin(), w == null ? null : w.comment());
        }).toList();
    }

    @Transactional
    public void comment(ClientAccess access, String workoutId, String text) {
        requireClientWorkout(access, workoutId);
        jdbcTemplate.update("""
                INSERT INTO workout_comments (workout_id, coach_user_id, body) VALUES (?, ?, ?)
                ON CONFLICT (workout_id, coach_user_id) DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()
                """, workoutId, access.coachUserId(), text.strip());
    }

    @Transactional
    public void deleteComment(ClientAccess access, String workoutId) {
        requireClientWorkout(access, workoutId);
        jdbcTemplate.update("DELETE FROM workout_comments WHERE workout_id = ? AND coach_user_id = ?",
                workoutId, access.coachUserId());
    }

    /** Comments on one of the caller's own workouts; empty for a workout that is not theirs. */
    @Transactional(readOnly = true)
    public List<WorkoutComment> commentsFor(String email, String workoutId) {
        return jdbcTemplate.query("""
                SELECT c.body, c.updated_at, u.name, u.email, u.picture
                FROM workout_comments c
                JOIN workouts w ON w.id = c.workout_id
                JOIN coach_public_profiles u ON u.id = c.coach_user_id
                WHERE c.workout_id = ? AND w.user_email = ?
                ORDER BY c.updated_at
                """,
                (rs, n) -> new WorkoutComment(
                        new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture")),
                        rs.getString("body"), toInstant(rs.getTimestamp("updated_at"))),
                workoutId, Emails.normalize(email));
    }

    private void requireClientWorkout(ClientAccess access, String workoutId) {
        Boolean owns = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM workouts WHERE id = ? AND user_email = ?)",
                Boolean.class, workoutId, access.clientEmail());
        if (!Boolean.TRUE.equals(owns)) {
            throw new EntityNotFoundException("Entrenamiento no encontrado");
        }
    }

    private static java.time.Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

}
