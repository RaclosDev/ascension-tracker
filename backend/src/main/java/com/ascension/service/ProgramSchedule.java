package com.ascension.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
public class ProgramSchedule {
    private final JdbcTemplate jdbc;

    public ProgramSchedule(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void lock(UUID linkId) {
        jdbc.queryForObject("SELECT id FROM coach_clients WHERE id = ? FOR UPDATE", UUID.class, linkId);
    }

    // Caller holds the link lock. Cancelling an upcoming plan reconnects the previous interval.
    public int end(UUID assignmentId) {
        int changed = jdbc.update("""
                UPDATE program_assignments SET status = 'ENDED', ended_at = NOW()
                WHERE id = ? AND status = 'ACTIVE'
                """, assignmentId);
        if (changed > 0) jdbc.update("""
                UPDATE coach_week_plans SET published_version = NULL, assignment_id = NULL
                WHERE assignment_id = ? AND week_start >= date_trunc('week', CURRENT_DATE)::date
                """, assignmentId);
        jdbc.update("""
                UPDATE program_assignments previous SET effective_until = (
                    SELECT MIN(next.start_date) FROM program_assignments next
                    WHERE next.coach_link_id = previous.coach_link_id AND next.status = 'ACTIVE'
                      AND next.start_date > previous.start_date)
                FROM program_assignments cancelled
                WHERE cancelled.id = ? AND cancelled.start_date > CURRENT_DATE
                  AND previous.coach_link_id = cancelled.coach_link_id AND previous.status = 'ACTIVE'
                  AND previous.effective_until = cancelled.start_date
                """, assignmentId);
        return changed;
    }

    public LocalDate prepare(UUID linkId, LocalDate startDate) {
        // Replacing the same date is explicit in the publication confirmation. Past copies remain intact.
        jdbc.update("""
                UPDATE program_assignments SET status = 'ENDED', ended_at = NOW()
                WHERE coach_link_id = ? AND status = 'ACTIVE'
                  AND (start_date = ? OR (start_date < ? AND ? <= CURRENT_DATE))
                """, linkId, startDate, startDate, startDate);
        jdbc.update("""
                UPDATE coach_week_plans wp SET published_version = NULL, assignment_id = NULL
                WHERE wp.link_id = ? AND wp.week_start >= date_trunc('week', CURRENT_DATE)::date
                  AND EXISTS (SELECT 1 FROM program_assignments pa WHERE pa.id = wp.assignment_id AND pa.status = 'ENDED')
                """, linkId);
        jdbc.update("""
                UPDATE program_assignments SET effective_until = ?
                WHERE coach_link_id = ? AND status = 'ACTIVE' AND start_date < ?
                  AND (effective_until IS NULL OR effective_until > ?)
                """, startDate, linkId, startDate, startDate);
        return jdbc.queryForObject("""
                SELECT MIN(start_date) FROM program_assignments
                WHERE coach_link_id = ? AND status = 'ACTIVE' AND start_date > ?
                """, LocalDate.class, linkId, startDate);
    }
}
