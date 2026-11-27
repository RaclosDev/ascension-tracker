package com.ascension.service;

import com.ascension.util.AppClock;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachWeekService {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RowMapper<Saved> MAPPER = (rs, n) -> new Saved(
            rs.getObject("link_id", UUID.class), rs.getObject("week_start", LocalDate.class),
            JSON.readValue(rs.getString("content"), Content.class), rs.getInt("version"),
            rs.getObject("assignment_id", UUID.class), rs.getObject("published_version", Integer.class),
            rs.getTimestamp("updated_at").toInstant(), rs.getObject("linked_from", LocalDate.class));
    private static final int MAX_BLOCK_WEEKS = 12;
    private final JdbcTemplate jdbc;
    private final CoachAccessPolicy access;
    private final ProgramSchedule schedule;
    private final ProgramAssignmentService assignments;

    // Reading client data also records the coach's access for the client.
    @Transactional
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
        // Editing a week's sessions by hand stops it from following the week it repeated; its type or notes do not.
        boolean sameSessions = previous.content().program().days().equals(request.content().program().days());
        write(link, week, request.content(), sameSessions ? previous.linkedFrom() : null);
        // Weeks that repeat this one follow it, each keeping its own notes and intent.
        for (Saved follower : jdbc.query("""
                SELECT * FROM coach_week_plans WHERE link_id = ? AND linked_from = ? AND week_start >= ?
                """, MAPPER, link, week, thisMonday())) {
            write(link, follower.weekStart(), repeated(request.content().program(), follower), week);
        }
        return current(link, week);
    }

    @Transactional
    public Saved publish(String email, UUID link, LocalDate week, Publish request) {
        var client = access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        schedule.lock(link);
        return publishLocked(client, week, request.expectedVersion());
    }

    /** The weeks from {@code from}, saved or not, with the athlete's block when there is one. */
    @Transactional
    public Block block(String email, UUID link, LocalDate from, int weeks) {
        access.require(email, link, CoachAccessPolicy.Action.VIEW_PROGRAMS);
        validateWeek(from);
        if (weeks < 1 || weeks > MAX_BLOCK_WEEKS)
            throw new InvalidInputException("Puedes ver de 1 a 12 semanas a la vez.");
        return new Block(definition(link), range(link, from, weeks));
    }

    @Transactional
    public BlockDefinition saveBlock(String email, UUID link, BlockDefinition block) {
        access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        validateWeek(block.startWeek());
        jdbc.update("""
                INSERT INTO coach_blocks (link_id, name, start_week, weeks) VALUES (?, ?, ?, ?)
                ON CONFLICT (link_id) DO UPDATE SET name = EXCLUDED.name, start_week = EXCLUDED.start_week,
                    weeks = EXCLUDED.weeks, updated_at = NOW()
                """, link, block.name().strip(), block.startWeek(), block.weeks());
        return definition(link);
    }

    @Transactional
    public void deleteBlock(String email, UUID link) {
        access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        jdbc.update("DELETE FROM coach_blocks WHERE link_id = ?", link);
    }

    /** Publishes several weeks together: either all of them reach the athlete or none does. */
    @Transactional
    public List<Saved> publishMany(String email, UUID link, PublishMany request) {
        var client = access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        schedule.lock(link);
        List<WeekVersion> weeks = request.weeks().stream().sorted(Comparator.comparing(WeekVersion::week)).toList();
        if (weeks.stream().map(WeekVersion::week).distinct().count() != weeks.size())
            throw new InvalidInputException("Cada semana solo puede publicarse una vez.");
        List<Saved> published = new ArrayList<>();
        for (WeekVersion week : weeks) published.add(publishLocked(client, week.week(), week.expectedVersion()));
        return published;
    }

    /** Copies one week's sessions onto others, which then follow it until they are edited by hand. */
    @Transactional
    public List<Saved> repeat(String email, UUID link, Repeat request) {
        access.require(email, link, CoachAccessPolicy.Action.ASSIGN_PROGRAM);
        validateWeek(request.source());
        if (new HashSet<>(request.targets()).size() != request.targets().size()
                || request.targets().contains(request.source()))
            throw new InvalidInputException("Elige semanas distintas de la que repites.");
        request.targets().forEach(CoachWeekService::validateEditableWeek);
        schedule.lock(link);
        Saved source = current(link, request.source());
        if (source.version() == 0) throw new InvalidInputException("Prepara la semana antes de repetirla.");
        List<Saved> repeated = new ArrayList<>();
        for (LocalDate target : request.targets().stream().sorted().toList()) {
            write(link, target, repeated(source.content().program(), current(link, target)), request.source());
            repeated.add(current(link, target));
        }
        return repeated;
    }

    @Transactional(readOnly = true)
    public List<Saved> exportFor(String email) {
        // Private planning notes belong only to the coach; published prescriptions are in the client's programs.
        return jdbc.query("""
                SELECT p.* FROM coach_week_plans p JOIN coach_clients c ON c.id = p.link_id
                JOIN users u ON u.id = c.coach_user_id WHERE u.email = ? ORDER BY week_start
                """, MAPPER, Emails.normalize(email));
    }

    private Saved publishLocked(CoachAccessPolicy.ClientAccess client, LocalDate week, int expectedVersion) {
        validateEditableWeek(week);
        UUID link = client.linkId();
        Saved draft = current(link, week);
        requireVersion(draft, expectedVersion);
        if (draft.version() == 0) throw new InvalidInputException("Guarda el borrador antes de publicar.");
        if (Integer.valueOf(draft.version()).equals(draft.publishedVersion())) return draft;
        LocalDate start = week.isBefore(AppClock.today()) ? AppClock.today() : week;
        // Days already elapsed are retained in the draft for review, but never republished as overdue work.
        var assigned = assignments.publishWeek(client, draft.content().program(), start);
        jdbc.update("""
                UPDATE coach_week_plans SET assignment_id = ?, published_version = version, updated_at = NOW()
                WHERE link_id = ? AND week_start = ?
                """, assigned.id(), link, week);
        return current(link, week);
    }

    private void write(UUID link, LocalDate week, Content content, LocalDate linkedFrom) {
        jdbc.update("""
                INSERT INTO coach_week_plans (link_id, week_start, content, linked_from) VALUES (?, ?, CAST(? AS jsonb), ?)
                ON CONFLICT (link_id, week_start) DO UPDATE SET content = EXCLUDED.content,
                    linked_from = EXCLUDED.linked_from, version = coach_week_plans.version + 1, updated_at = NOW()
                """, link, week, JSON.writeValueAsString(content), linkedFrom);
    }

    /** The source's sessions under the target week's own name, notes and intent. */
    private static Content repeated(Program source, Saved target) {
        Content own = target.content();
        return new Content(new Program(null, own.program().name(), source.notes(), 1, source.days(), null,
                source.status()), own.privateNotes(), own.intent(), own.decision());
    }

    private BlockDefinition definition(UUID link) {
        return jdbc.query("SELECT name, start_week, weeks FROM coach_blocks WHERE link_id = ?",
                (rs, n) -> new BlockDefinition(rs.getString("name"), rs.getObject("start_week", LocalDate.class),
                        rs.getInt("weeks")), link).stream().findFirst().orElse(null);
    }

    private List<Saved> range(UUID link, LocalDate from, int weeks) {
        Map<LocalDate, Saved> saved = jdbc.query("""
                SELECT * FROM coach_week_plans WHERE link_id = ? AND week_start >= ? AND week_start < ?
                """, MAPPER, link, from, from.plusWeeks(weeks)).stream()
                .collect(Collectors.toMap(Saved::weekStart, Function.identity()));
        List<Saved> all = new ArrayList<>();
        for (int i = 0; i < weeks; i++) {
            LocalDate week = from.plusWeeks(i);
            all.add(saved.getOrDefault(week, empty(link, week)));
        }
        return all;
    }

    private Saved current(UUID link, LocalDate week) {
        return jdbc.query("SELECT * FROM coach_week_plans WHERE link_id = ? AND week_start = ?", MAPPER, link, week)
                .stream().findFirst().orElseGet(() -> empty(link, week));
    }

    private static Saved empty(UUID link, LocalDate week) {
        return new Saved(link, week,
                new Content(new Program(null, "Semana del " + week, null, 1, List.of(), null, "DRAFT"),
                        "", "BUILD", ""), 0, null, null, null, null);
    }

    private static void requireVersion(Saved previous, int expected) {
        if (previous.version() != expected)
            throw new OptimisticLockingFailureException("Otra sesión ha cambiado esta semana. Tus cambios se conservan; revisa ambas versiones.");
    }

    private static void validateWeek(LocalDate week) {
        if (week.getDayOfWeek() != DayOfWeek.MONDAY)
            throw new InvalidInputException("La semana debe empezar en lunes.");
    }

    private static LocalDate thisMonday() {
        return AppClock.today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private static void validateEditableWeek(LocalDate week) {
        validateWeek(week);
        LocalDate monday = thisMonday();
        if (week.isBefore(monday) || week.isAfter(monday.plusWeeks(52)))
            throw new InvalidInputException("Solo puedes preparar la semana actual y las próximas 52 semanas.");
    }
}
