package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.ProgramDtos.Exercise;
import com.ascension.dto.ProgramDtos.TodayDay;
import com.ascension.dto.ProgramDtos.TodayPlan;
import com.ascension.exception.EntityNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

/**
 * The client's side of assigned programs: what is prescribed for a date, and the ownership check
 * used when a workout claims a prescribed day. Everything is scoped to the caller's own copies.
 * Weeks follow the calendar: week 1 is the Monday-to-Sunday week holding the start date, and
 * {@code dayIndex} is the weekday (1 = Monday), as in the coach's program builder.
 */
@Service
public class ClientProgramService {

    private final JdbcTemplate jdbcTemplate;
    private final ProgramSchedule schedule;

    public ClientProgramService(JdbcTemplate jdbcTemplate, ProgramSchedule schedule) {
        this.jdbcTemplate = jdbcTemplate;
        this.schedule = schedule;
    }

    private record Active(UUID assignmentId, UUID programId, String programName, String coachName,
                          LocalDate startDate, LocalDate effectiveUntil, int weeks, String notes) {
    }

    @Transactional(readOnly = true)
    public List<TodayPlan> today(String email, LocalDate date) {
        List<Active> active = jdbcTemplate.query("""
                SELECT a.id, a.program_id, p.name, p.weeks, p.notes, a.start_date, a.effective_until, c.name AS coach_name
                FROM program_assignments a
                JOIN programs p ON p.id = a.program_id
                JOIN users u ON u.id = a.client_user_id
                LEFT JOIN coach_public_profiles c ON c.id = a.coach_user_id
                WHERE u.email = ? AND a.status = 'ACTIVE' AND p.owner_user_id = u.id
                  AND (a.effective_until IS NULL OR a.effective_until > ?)
                ORDER BY a.start_date DESC, a.created_at DESC
                """,
                (rs, n) -> new Active(rs.getObject("id", UUID.class), rs.getObject("program_id", UUID.class),
                        rs.getString("name"), rs.getString("coach_name"),
                        rs.getObject("start_date", LocalDate.class), rs.getObject("effective_until", LocalDate.class), rs.getInt("weeks"), rs.getString("notes")),
                Emails.normalize(email), date);
        return active.stream().map(a -> plan(email, a, date)).toList();
    }

    /** True when an active program prescribes a session on {@code date}. */
    @Transactional(readOnly = true)
    public boolean isTrainingDay(String email, LocalDate date) {
        return today(email, date).stream().anyMatch(plan -> plan.day() != null);
    }

    /** True when the day belongs to an assigned program copy this user owns. */
    @Transactional(readOnly = true)
    public boolean ownsProgramDay(String email, UUID programDayId) {
        Boolean owns = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM program_days d
                    JOIN programs p ON p.id = d.program_id
                    JOIN users u ON u.id = p.owner_user_id
                    WHERE d.id = ? AND u.email = ? AND NOT p.is_library)
                """, Boolean.class, programDayId, Emails.normalize(email));
        return Boolean.TRUE.equals(owns);
    }

    /** The client stops following a program; the copy stays theirs. */
    @Transactional
    public void end(String email, UUID assignmentId) {
        List<UUID> links = jdbcTemplate.queryForList("""
                SELECT coach_link_id FROM program_assignments
                WHERE id = ? AND status = 'ACTIVE' AND (effective_until IS NULL OR effective_until > CURRENT_DATE)
                  AND client_user_id = (SELECT id FROM users WHERE email = ?)
                """, UUID.class, assignmentId, Emails.normalize(email));
        if (links.isEmpty()) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
        if (links.getFirst() != null) schedule.lock(links.getFirst());
        if (schedule.end(assignmentId) == 0) throw new EntityNotFoundException("Programa no encontrado");
    }

    private TodayPlan plan(String email, Active a, LocalDate date) {
        if (date.isBefore(a.startDate())) {
            return new TodayPlan(a.assignmentId(), a.programId(), a.programName(), a.coachName(), a.startDate(),
                    a.weeks(), "UPCOMING", null, null, null, null, List.of(), a.notes());
        }
        LocalDate firstMonday = a.startDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        int week = (int) (ChronoUnit.DAYS.between(firstMonday, date) / 7) + 1;
        if (week > a.weeks()) {
            return new TodayPlan(a.assignmentId(), a.programId(), a.programName(), a.coachName(), a.startDate(),
                    a.weeks(), "FINISHED", null, null, null, null, List.of(), a.notes());
        }
        int dayIndex = date.getDayOfWeek().getValue();
        TodayDay day = jdbcTemplate.query("""
                SELECT id, name, notes FROM program_days WHERE program_id = ? AND week = ? AND day_index = ?
                """,
                (rs, n) -> new TodayDay(rs.getObject("id", UUID.class), week, dayIndex, rs.getString("name"),
                        rs.getString("notes"), exercises(rs.getObject("id", UUID.class))),
                a.programId(), week, dayIndex).stream().findFirst().orElse(null);
        String completed = day == null ? null : jdbcTemplate.queryForList("""
                SELECT id FROM workouts WHERE program_day_id = ? AND user_email = ?
                ORDER BY started_at DESC LIMIT 1
                """, String.class, day.id(), email).stream().findFirst().orElse(null);
        List<TodayDay> otherDays = jdbcTemplate.query("""
                SELECT d.id, d.day_index, d.name, d.notes FROM program_days d
                WHERE d.program_id = ? AND d.week = ? AND d.day_index <> ?
                  AND NOT EXISTS (SELECT 1 FROM workouts w WHERE w.program_day_id = d.id AND w.user_email = ?)
                ORDER BY d.day_index
                """,
                (rs, n) -> new TodayDay(rs.getObject("id", UUID.class), week, rs.getInt("day_index"),
                        rs.getString("name"), rs.getString("notes"), exercises(rs.getObject("id", UUID.class))),
                a.programId(), week, dayIndex, email);
        List<TodayDay> validDays = otherDays.stream().filter(d -> {
            LocalDate scheduled = firstMonday.plusWeeks(d.week() - 1L).plusDays(d.dayIndex() - 1L);
            return !scheduled.isBefore(a.startDate()) &&
                    (a.effectiveUntil() == null || scheduled.isBefore(a.effectiveUntil()));
        }).toList();
        return new TodayPlan(a.assignmentId(), a.programId(), a.programName(), a.coachName(), a.startDate(),
                a.weeks(), "ACTIVE", week, dayIndex, day, completed, validDays, a.notes());
    }

    private List<Exercise> exercises(UUID programDayId) {
        return jdbcTemplate.query("SELECT * FROM program_exercises WHERE program_day_id = ? ORDER BY order_index",
                (rs, n) -> ProgramService.exercise(rs), programDayId);
    }

}
