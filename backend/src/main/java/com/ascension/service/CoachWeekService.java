package com.ascension.service;

import com.ascension.dto.CoachWeekDtos.*;
import com.ascension.dto.ProgramDtos.Program;
import com.ascension.exception.InvalidInputException;
import com.ascension.util.Emails;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoachWeekService {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RowMapper<Saved> MAPPER = (rs, n) -> new Saved(
            rs.getObject("link_id", UUID.class), rs.getObject("week_start", LocalDate.class),
            JSON.readValue(rs.getString("content"), Content.class), rs.getInt("version"),
            rs.getObject("assignment_id", UUID.class), rs.getObject("published_version", Integer.class),
            rs.getTimestamp("updated_at").toInstant());
    private final JdbcTemplate jdbc;
    private final CoachAccessPolicy access;
    private final ProgramSchedule schedule;
    private final ProgramAssignmentService assignments;

    @Transactional(readOnly = true)
    public Saved get(String email, UUID link, LocalDate week) {
        access.require(email, link, CoachAccessPolicy.Action.VIEW_PROGRAMS);
        validateWeek(week);
        return current(link, week);
    }

    @Transactional
    public Saved save(String email, UUID link, LocalDate week, Save request) {
        access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        validateEditableWeek(week);
        schedule.lock(link);
        Saved previous = current(link, week);
        requireVersion(previous, request.expectedVersion());
        ProgramService.validate(request.content().program());
        if (request.content().program().weeks() != 1)
            throw new InvalidInputException("El borrador semanal debe contener una sola semana.");
        jdbc.update("""
                INSERT INTO coach_week_plans (link_id, week_start, content) VALUES (?, ?, CAST(? AS jsonb))
                ON CONFLICT (link_id, week_start) DO UPDATE SET content = EXCLUDED.content,
                    version = coach_week_plans.version + 1, updated_at = NOW()
                """, link, week, JSON.writeValueAsString(request.content()));
        return current(link, week);
    }

    @Transactional
    public Saved publish(String email, UUID link, LocalDate week, Publish request) {
        var client = access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        validateEditableWeek(week);
        schedule.lock(link);
        Saved draft = current(link, week);
        requireVersion(draft, request.expectedVersion());
        if (draft.version() == 0) throw new InvalidInputException("Guarda el borrador antes de publicar.");
        if (Integer.valueOf(draft.version()).equals(draft.publishedVersion())) return draft;
        LocalDate start = week.isBefore(LocalDate.now()) ? LocalDate.now() : week;
        Program program = draft.content().program();
        // Days already elapsed are retained in the draft for review, but never republished as overdue work.
        var assigned = assignments.publishWeek(client, program, start);
        jdbc.update("""
                UPDATE coach_week_plans SET assignment_id = ?, published_version = version, updated_at = NOW()
                WHERE link_id = ? AND week_start = ?
                """, assigned.id(), link, week);
        return current(link, week);
    }

    @Transactional(readOnly = true)
    public List<Saved> exportFor(String email) {
        // Private planning notes belong only to the coach; published prescriptions are in the client's programs.
        return jdbc.query("""
                SELECT p.* FROM coach_week_plans p JOIN coach_clients c ON c.id = p.link_id
                JOIN users u ON u.id = c.coach_user_id WHERE u.email = ? ORDER BY week_start
                """, MAPPER, Emails.normalize(email));
    }

    private Saved current(UUID link, LocalDate week) {
        return jdbc.query("SELECT * FROM coach_week_plans WHERE link_id = ? AND week_start = ?", MAPPER, link, week)
                .stream().findFirst().orElseGet(() -> new Saved(link, week,
                        new Content(new Program(null, "Semana del " + week, null, 1, List.of(), null, "DRAFT"),
                                "", "BUILD", ""), 0, null, null, null));
    }

    private static void requireVersion(Saved previous, int expected) {
        if (previous.version() != expected)
            throw new OptimisticLockingFailureException("Otra sesión ha cambiado esta semana. Tus cambios se conservan; revisa ambas versiones.");
    }

    private static void validateWeek(LocalDate week) {
        if (week.getDayOfWeek() != DayOfWeek.MONDAY)
            throw new InvalidInputException("La semana debe empezar en lunes.");
    }

    private static void validateEditableWeek(LocalDate week) {
        validateWeek(week);
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        if (week.isBefore(monday) || week.isAfter(monday.plusWeeks(52)))
            throw new InvalidInputException("Solo puedes preparar la semana actual y las próximas 52 semanas.");
    }
}
