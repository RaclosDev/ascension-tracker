package com.ascension.service;

import com.ascension.dto.ProgramDtos.AssignRequest;
import com.ascension.dto.ProgramDtos.Assignment;
import com.ascension.dto.ProgramDtos.Program;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
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
            SELECT a.id, a.program_id, p.source_program_id, p.name, p.weeks, a.start_date, a.status,
                   a.created_at, a.ended_at
            FROM program_assignments a JOIN programs p ON p.id = a.program_id
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ProgramService programService;

    public ProgramAssignmentService(JdbcTemplate jdbcTemplate, ProgramService programService) {
        this.jdbcTemplate = jdbcTemplate;
        this.programService = programService;
    }

    @Transactional(readOnly = true)
    public List<Assignment> list(ClientAccess access) {
        return jdbcTemplate.query(SELECT + " WHERE a.coach_link_id = ? ORDER BY a.created_at DESC",
                ProgramAssignmentService::assignment, access.linkId());
    }

    @Transactional
    public Assignment assign(ClientAccess access, AssignRequest request) {
        LocalDate today = LocalDate.now();
        if (request.startDate().isBefore(today.minusDays(MAX_START_OFFSET_DAYS))
                || request.startDate().isAfter(today.plusDays(MAX_START_OFFSET_DAYS))) {
            throw new InvalidInputException("La fecha de inicio debe estar a menos de un año de hoy");
        }
        lockLink(access.linkId());
        List<UUID> found = jdbcTemplate.queryForList(
                "SELECT id FROM programs WHERE id = ? AND owner_user_id = ? AND is_library",
                UUID.class, request.programId(), access.coachUserId());
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Programa no encontrado");
        }
        Integer copies = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM programs WHERE owner_user_id = ? AND NOT is_library",
                Integer.class, access.clientUserId());
        if (copies != null && copies >= MAX_COPIES_PER_CLIENT) {
            throw new InvalidInputException("Tu alumno ya tiene demasiados programas guardados");
        }
        endActive(access.linkId());
        Program original = programService.readProgram(request.programId());
        UUID copyId = programService.insertProgram(access.clientUserId(), original, false, original.id());
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO program_assignments (program_id, client_user_id, coach_user_id, coach_link_id,
                                                 start_date, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE') RETURNING id
                """, UUID.class, copyId, access.clientUserId(), access.coachUserId(), access.linkId(),
                request.startDate());
        return jdbcTemplate.queryForObject(SELECT + " WHERE a.id = ?", ProgramAssignmentService::assignment, id);
    }

    @Transactional
    public void end(ClientAccess access, UUID assignmentId) {
        int updated = jdbcTemplate.update("""
                UPDATE program_assignments SET status = 'ENDED', ended_at = NOW()
                WHERE id = ? AND coach_link_id = ? AND status = 'ACTIVE'
                """, assignmentId, access.linkId());
        if (updated == 0) {
            throw new EntityNotFoundException("Asignación no encontrada");
        }
    }

    // Serialises assignments per link so the single active program holds without an index error.
    private void lockLink(UUID linkId) {
        jdbcTemplate.queryForObject("SELECT id FROM coach_clients WHERE id = ? FOR UPDATE", UUID.class, linkId);
    }

    private void endActive(UUID linkId) {
        jdbcTemplate.update("""
                UPDATE program_assignments SET status = 'ENDED', ended_at = NOW()
                WHERE coach_link_id = ? AND status = 'ACTIVE'
                """, linkId);
    }

    private static Assignment assignment(ResultSet rs, int n) throws SQLException {
        Timestamp ended = rs.getTimestamp("ended_at");
        return new Assignment(rs.getObject("id", UUID.class), rs.getObject("program_id", UUID.class),
                rs.getObject("source_program_id", UUID.class), rs.getString("name"), rs.getInt("weeks"),
                rs.getObject("start_date", LocalDate.class), rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(), ended == null ? null : ended.toInstant());
    }
}
