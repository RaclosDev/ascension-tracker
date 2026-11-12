package com.ascension.service;

import com.ascension.dto.ProgramDtos.AssignRequest;
import com.ascension.dto.ProgramDtos.AdaptRequest;
import com.ascension.dto.ProgramDtos.Assignment;
import com.ascension.dto.ProgramDtos.Program;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Assigns a coach's library program to a client by copying it: the client owns the copy, so later
 * edits or deletion of the original never change what the client was given. Callers resolve the
 * link through {@link CoachAccessPolicy} first, which enforces the client's consent.
 */
@Service
public class ProgramAssignmentService {

    /** Copies a client may accumulate; old ones are theirs to delete. */
    static final int MAX_COPIES_PER_CLIENT = 200;
    private static final int MAX_START_OFFSET_DAYS = 365;

    private static final String SELECT = """
            SELECT a.id, a.program_id, p.source_program_id, p.name, p.weeks, a.start_date,
                   CASE WHEN a.status = 'ENDED' THEN 'ENDED'
                        WHEN a.effective_until <= CURRENT_DATE THEN 'ENDED'
                        WHEN a.start_date > CURRENT_DATE THEN 'SCHEDULED' ELSE 'ACTIVE' END AS status,
                   a.created_at, a.effective_until, COALESCE(a.ended_at,
                     CASE WHEN a.effective_until <= CURRENT_DATE THEN a.effective_until::timestamptz END) AS ended_at
            FROM program_assignments a JOIN programs p ON p.id = a.program_id
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ProgramService programService;
    private final ProgramSchedule schedule;
    private final PrescriptionService prescriptions;

    public ProgramAssignmentService(JdbcTemplate jdbcTemplate, ProgramService programService, ProgramSchedule schedule, PrescriptionService prescriptions) {
        this.jdbcTemplate = jdbcTemplate;
        this.programService = programService;
        this.schedule = schedule;
        this.prescriptions = prescriptions;
    }

    @Transactional(readOnly = true)
    public List<Assignment> list(ClientAccess access) {
        return jdbcTemplate.query(SELECT + " WHERE a.coach_link_id = ? ORDER BY a.created_at DESC",
                ProgramAssignmentService::assignment, access.linkId());
    }

    @Transactional
    public Assignment assign(ClientAccess access, AssignRequest request) {
        validateDate(request.startDate());
        schedule.lock(access.linkId());
        List<UUID> found = jdbcTemplate.queryForList(
                "SELECT id FROM programs WHERE id = ? AND owner_user_id = ? AND is_library FOR UPDATE",
                UUID.class, request.programId(), access.coachUserId());
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
        requireCopyCapacity(access.clientUserId());
        Program original = programService.readProgram(request.programId());
        if (!"READY".equals(original.status())) {
            throw new InvalidInputException("El programa es un borrador. Márcalo como listo antes de asignarlo.");
        }
        ProgramService.validateReady(original);
        if (request.programUpdatedAt() != null && !request.programUpdatedAt().equals(original.updatedAt())) {
            throw new OptimisticLockingFailureException("El programa ha cambiado. Revisa la vista previa antes de asignarlo.");
        }
        UUID copyId = programService.insertProgram(access.clientUserId(), prescriptions.snapshot(original, access.linkId()), false, original.id());
        return createAssignment(access, copyId, request.startDate());
    }

    @Transactional(readOnly = true)
    public Program plan(ClientAccess access, UUID assignmentId) {
        return programService.readProgram(requireAssignment(access, assignmentId, false).programId());
    }

    @Transactional
    public Assignment publishWeek(ClientAccess access, Program program, LocalDate startDate) {
        validateDate(startDate);
        ProgramService.validate(program);
        ProgramService.validateReady(program);
        schedule.lock(access.linkId());
        requireCopyCapacity(access.clientUserId());
        UUID copy = programService.insertProgram(access.clientUserId(), prescriptions.snapshot(program, access.linkId()), false, null);
        return createAssignment(access, copy, startDate);
    }

    @Transactional
    public Assignment adapt(ClientAccess access, UUID assignmentId, AdaptRequest request) {
        validateDate(request.startDate());
        if (request.startDate().isBefore(LocalDate.now())) {
            throw new InvalidInputException("La adaptación debe empezar hoy o más adelante; el historial anterior se conserva.");
        }
        ProgramService.validate(request.program());
        ProgramService.validateReady(request.program());
        schedule.lock(access.linkId());
        Assignment original = requireAssignment(access, assignmentId, true);
        if ("ENDED".equals(original.status())) {
            throw new OptimisticLockingFailureException(
                    "Esta asignación ya ha terminado. Abre el programa actual del atleta antes de publicar cambios.");
        }
        requireCopyCapacity(access.clientUserId());
        UUID copyId = programService.insertProgram(access.clientUserId(), prescriptions.snapshot(request.program(), access.linkId()), false,
                original.sourceProgramId());
        if ("SCHEDULED".equals(original.status())) schedule.end(original.id());
        return createAssignment(access, copyId, request.startDate());
    }

    private Assignment requireAssignment(ClientAccess access, UUID assignmentId, boolean lock) {
        List<Assignment> found = jdbcTemplate.query(SELECT +
                        " WHERE a.id = ? AND a.coach_link_id = ?" + (lock ? " FOR UPDATE OF a" : ""),
                ProgramAssignmentService::assignment, assignmentId, access.linkId());
        if (found.isEmpty()) throw new EntityNotFoundException("Asignación no encontrada");
        return found.getFirst();
    }

    private Assignment createAssignment(ClientAccess access, UUID copyId, LocalDate startDate) {
        LocalDate until = schedule.prepare(access.linkId(), startDate);
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO program_assignments (program_id, client_user_id, coach_user_id, coach_link_id,
                                                 start_date, effective_until, status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE') RETURNING id
                """, UUID.class, copyId, access.clientUserId(), access.coachUserId(), access.linkId(),
                startDate, until);
        return jdbcTemplate.queryForObject(SELECT + " WHERE a.id = ?", ProgramAssignmentService::assignment, id);
    }

    @Transactional
    public void end(ClientAccess access, UUID assignmentId) {
        schedule.lock(access.linkId());
        Assignment assignment = requireAssignment(access, assignmentId, true);
        int updated = "ENDED".equals(assignment.status()) ? 0 : schedule.end(assignmentId);
        if (updated == 0) {
            throw new EntityNotFoundException("Asignación no encontrada");
        }
    }

    private void requireCopyCapacity(UUID clientId) {
        Integer copies = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM programs WHERE owner_user_id = ? AND NOT is_library", Integer.class, clientId);
        if (copies != null && copies >= MAX_COPIES_PER_CLIENT) {
            throw new InvalidInputException("Tu atleta ya tiene demasiados programas guardados");
        }
    }

    private static void validateDate(LocalDate startDate) {
        LocalDate today = LocalDate.now();
        if (startDate.isBefore(today.minusDays(MAX_START_OFFSET_DAYS))
                || startDate.isAfter(today.plusDays(MAX_START_OFFSET_DAYS))) {
            throw new InvalidInputException("La fecha de inicio debe estar a menos de un año de hoy");
        }
    }

    private static Assignment assignment(ResultSet rs, int n) throws SQLException {
        Timestamp ended = rs.getTimestamp("ended_at");
        return new Assignment(rs.getObject("id", UUID.class), rs.getObject("program_id", UUID.class),
                rs.getObject("source_program_id", UUID.class), rs.getString("name"), rs.getInt("weeks"),
                rs.getObject("start_date", LocalDate.class), rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(), ended == null ? null : ended.toInstant(),
                rs.getObject("effective_until", LocalDate.class));
    }
}
