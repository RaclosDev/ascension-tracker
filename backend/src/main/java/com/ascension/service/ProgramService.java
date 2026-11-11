package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.ProgramDtos.Day;
import com.ascension.dto.ProgramDtos.Exercise;
import com.ascension.dto.ProgramDtos.Program;
import com.ascension.dto.ProgramDtos.ProgramSummary;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The coach's program library. Every query is scoped to the coach's own library rows, so another
 * coach's (or a client's) program id behaves exactly like an unknown one: 404.
 */
@Service
public class ProgramService {

    static final int MAX_LIBRARY_PROGRAMS = 100;
    private static final String COPY_SUFFIX = " (copia)";

    private final JdbcTemplate jdbcTemplate;
    private final CoachService coachService;

    public ProgramService(JdbcTemplate jdbcTemplate, CoachService coachService) {
        this.jdbcTemplate = jdbcTemplate;
        this.coachService = coachService;
    }

    public List<ProgramSummary> listLibrary(String coachEmail) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        return jdbcTemplate.query("""
                SELECT p.id, p.name, p.weeks, p.updated_at, p.library_status,
                       (SELECT COUNT(*) FROM program_days d WHERE d.program_id = p.id) AS day_count
                FROM programs p
                WHERE p.owner_user_id = ? AND p.is_library
                ORDER BY LOWER(p.name), p.created_at
                """,
                (rs, n) -> new ProgramSummary(rs.getObject("id", UUID.class), rs.getString("name"),
                        rs.getInt("weeks"), rs.getInt("day_count"), rs.getTimestamp("updated_at").toInstant(),
                        rs.getString("library_status")),
                coachId);
    }

    @Transactional(readOnly = true)
    public Program getLibraryProgram(String coachEmail, UUID programId) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        requireLibraryProgram(coachId, programId, false);
        return readProgram(programId);
    }

    @Transactional
    public Program createLibraryProgram(String coachEmail, Program program) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        validate(program);
        lockCoach(coachId);
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM programs WHERE owner_user_id = ? AND is_library",
                Integer.class, coachId);
        if (count != null && count >= MAX_LIBRARY_PROGRAMS) {
            throw new InvalidInputException("Has alcanzado el máximo de programas en tu biblioteca.");
        }
        UUID id = insertProgram(coachId, program, true, null);
        return readProgram(id);
    }

    @Transactional
    public Program updateLibraryProgram(String coachEmail, UUID programId, Program program) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        validate(program);
        requireLibraryProgram(coachId, programId, true);
        Program current = readProgram(programId);
        if (program.updatedAt() != null && !program.updatedAt().equals(current.updatedAt())) {
            throw new OptimisticLockingFailureException("El programa ha cambiado. Recarga la versión guardada antes de editar.");
        }
        jdbcTemplate.update("""
                UPDATE programs SET name = ?, notes = ?, weeks = ?, library_status = ?, updated_at = clock_timestamp() WHERE id = ?
                """, program.name().trim(), blankToNull(program.notes()), program.weeks(), status(program), programId);
        jdbcTemplate.update("DELETE FROM program_days WHERE program_id = ?", programId);
        insertDays(programId, program.days());
        return readProgram(programId);
    }

    @Transactional
    public Program duplicateLibraryProgram(String coachEmail, UUID programId) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        requireLibraryProgram(coachId, programId, false);
        Program original = readProgram(programId);
        String name = original.name();
        if (name.length() + COPY_SUFFIX.length() <= 120) {
            name += COPY_SUFFIX;
        }
        return createLibraryProgram(coachEmail, new Program(null, name, original.notes(), original.weeks(),
                original.days(), null, "DRAFT"));
    }

    @Transactional
    public void deleteLibraryProgram(String coachEmail, UUID programId) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        int deleted = jdbcTemplate.update(
                "DELETE FROM programs WHERE id = ? AND owner_user_id = ? AND is_library", programId, coachId);
        if (deleted == 0) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
    }

    /** Every program this account owns, for the GDPR export. */
    @Transactional(readOnly = true)
    public List<Program> exportFor(String email) {
        return jdbcTemplate.queryForList("""
                SELECT p.id FROM programs p JOIN users u ON u.id = p.owner_user_id
                WHERE u.email = ? ORDER BY p.created_at
                """, UUID.class, Emails.normalize(email))
                .stream().map(this::readProgram).toList();
    }

    // ---- Shared with assignment ----

    /** Reads a program by id without any ownership check: callers must have checked it. */
    Program readProgram(UUID programId) {
        Program header = jdbcTemplate.queryForObject(
                "SELECT id, name, notes, weeks, updated_at, library_status FROM programs WHERE id = ?",
                (rs, n) -> new Program(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("notes"),
                        rs.getInt("weeks"), List.of(), rs.getTimestamp("updated_at").toInstant(),
                        rs.getString("library_status")),
                programId);
        Map<UUID, DayRow> days = new LinkedHashMap<>();
        jdbcTemplate.query("""
                SELECT id, week, day_index, name, notes FROM program_days
                WHERE program_id = ? ORDER BY week, day_index
                """,
                rs -> {
                    days.put(rs.getObject("id", UUID.class), new DayRow(rs.getInt("week"), rs.getInt("day_index"),
                            rs.getString("name"), rs.getString("notes"), new ArrayList<>()));
                },
                programId);
        jdbcTemplate.query("""
                SELECT e.* FROM program_exercises e JOIN program_days d ON d.id = e.program_day_id
                WHERE d.program_id = ? ORDER BY e.program_day_id, e.order_index
                """,
                rs -> {
                    days.get(rs.getObject("program_day_id", UUID.class)).exercises().add(exercise(rs));
                },
                programId);
        List<Day> dayList = days.values().stream()
                .map(d -> new Day(d.week(), d.dayIndex(), d.name(), d.notes(), List.copyOf(d.exercises())))
                .toList();
        return new Program(header.id(), header.name(), header.notes(), header.weeks(), dayList, header.updatedAt(), header.status());
    }

    UUID insertProgram(UUID ownerId, Program program, boolean library, UUID sourceProgramId) {
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO programs (owner_user_id, name, notes, weeks, is_library, source_program_id, library_status)
                VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, ownerId, program.name().trim(), blankToNull(program.notes()), program.weeks(),
                library, sourceProgramId, library ? status(program) : "READY");
        insertDays(id, program.days());
        return id;
    }

    // ---- Helpers ----

    private record DayRow(int week, int dayIndex, String name, String notes, List<Exercise> exercises) {
    }

    private void insertDays(UUID programId, List<Day> days) {
        for (Day day : days) {
            UUID dayId = jdbcTemplate.queryForObject("""
                    INSERT INTO program_days (program_id, week, day_index, name, notes)
                    VALUES (?, ?, ?, ?, ?) RETURNING id
                    """, UUID.class, programId, day.week(), day.dayIndex(), day.name().trim(),
                    blankToNull(day.notes()));
            List<Object[]> rows = new ArrayList<>();
            for (int i = 0; i < day.exercises().size(); i++) {
                Exercise e = day.exercises().get(i);
                rows.add(new Object[]{dayId, i, e.exerciseId(), blankToNull(e.exerciseName()),
                        blankToNull(e.variantGrip()), blankToNull(e.variantMachine()), e.sets(), e.repsMin(),
                        e.repsMax(), e.targetRpe(), e.targetRir(), e.restSeconds(), blankToNull(e.loadHint()),
                        e.supersetGroup(), blankToNull(e.notes())});
            }
            if (!rows.isEmpty()) {
                jdbcTemplate.batchUpdate("""
                        INSERT INTO program_exercises (program_day_id, order_index, exercise_id, exercise_name,
                            variant_grip, variant_machine, sets, reps_min, reps_max, target_rpe, target_rir,
                            rest_seconds, load_hint, superset_group, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, rows);
            }
        }
    }

    private void requireLibraryProgram(UUID coachId, UUID programId, boolean lock) {
        List<UUID> found = jdbcTemplate.queryForList(
                "SELECT id FROM programs WHERE id = ? AND owner_user_id = ? AND is_library"
                        + (lock ? " FOR UPDATE" : ""),
                UUID.class, programId, coachId);
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
    }

    // Serialises library writes per coach so the program limit holds under concurrency.
    private void lockCoach(UUID coachId) {
        jdbcTemplate.queryForObject("SELECT user_id FROM coach_profiles WHERE user_id = ? FOR UPDATE",
                UUID.class, coachId);
    }

    /** Rules the annotations cannot express: days inside the program and one day per slot. */
    static void validate(Program program) {
        if ("READY".equals(status(program))) validateReady(program);
        Set<String> slots = new HashSet<>();
        for (Day day : program.days()) {
            if (day.week() > program.weeks()) {
                throw new InvalidInputException("Hay días fuera de las semanas del programa.");
            }
            if (!slots.add(day.week() + "-" + day.dayIndex())) {
                throw new InvalidInputException("Hay dos días en el mismo hueco de la semana.");
            }
            for (Exercise e : day.exercises()) {
                if (e.repsMin() != null && e.repsMax() != null && e.repsMin() > e.repsMax()) {
                    throw new InvalidInputException("Las repeticiones mínimas superan a las máximas.");
                }
            }
        }
    }

    static void validateReady(Program program) {
        if (program.days().isEmpty() || program.days().stream().anyMatch(day -> day.exercises().isEmpty())) {
            throw new InvalidInputException("Añade al menos una sesión y ejercicios en cada día antes de marcar el programa como listo.");
        }
    }

    private static String status(Program program) {
        return program.status() == null ? "DRAFT" : program.status();
    }

    static Exercise exercise(ResultSet rs) throws SQLException {
        return new Exercise(rs.getString("exercise_id"), rs.getString("exercise_name"),
                rs.getString("variant_grip"), rs.getString("variant_machine"), rs.getInt("sets"),
                integer(rs, "reps_min"), integer(rs, "reps_max"), rs.getBigDecimal("target_rpe"),
                integer(rs, "target_rir"), integer(rs, "rest_seconds"), rs.getString("load_hint"),
                integer(rs, "superset_group"), rs.getString("notes"));
    }

    private static Integer integer(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
