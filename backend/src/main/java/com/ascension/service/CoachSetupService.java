package com.ascension.service;

import com.ascension.dto.CoachSetupDtos.CoachNotes;
import com.ascension.dto.CoachSetupDtos.Setup;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.util.Emails;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
public class CoachSetupService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public CoachSetupService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public Setup decode(String json) {
        return json == null ? null : mapper.readValue(json, Setup.class);
    }

    public String encode(Setup setup) {
        return setup == null ? null : mapper.writeValueAsString(setup);
    }

    public CoachNotes decodeNotes(String json) {
        return json == null ? new CoachNotes(null, null) : mapper.readValue(json, CoachNotes.class);
    }

    /** Saves the coach's own notes about an athlete. Only the coach of an active link can write them. */
    @Transactional
    public CoachNotes saveNotes(String coachEmail, UUID linkId, CoachNotes notes) {
        String pinned = notes.pinnedNote() == null || notes.pinnedNote().isBlank() ? null : notes.pinnedNote().strip();
        CoachNotes clean = new CoachNotes(pinned, notes.avoidedExercises());
        int updated = jdbc.update("""
                UPDATE coach_clients SET coach_notes = ?::jsonb
                WHERE id = ? AND status = 'ACTIVE'
                  AND coach_user_id = (SELECT id FROM users WHERE email = ?)
                """, mapper.writeValueAsString(clean), linkId, Emails.normalizeRequired(coachEmail));
        if (updated == 0) throw new EntityNotFoundException("Atleta no encontrado");
        return clean;
    }

    @Transactional
    public Setup save(String coachEmail, UUID linkId, Setup setup) {
        int updated = jdbc.update("""
                UPDATE coach_clients SET coaching_setup = ?::jsonb, setup_updated_at = NOW(),
                    setup_started_at = COALESCE(setup_started_at, NOW()),
                    followup_started_at = CASE WHEN ? AND COALESCE(coaching_setup ->> 'reviewed', 'false') <> 'true'
                        THEN NOW() ELSE followup_started_at END
                WHERE id = ? AND status = 'ACTIVE'
                  AND coach_user_id = (SELECT id FROM users WHERE email = ?)
                """, encode(setup), setup.reviewed(), linkId, Emails.normalizeRequired(coachEmail));
        if (updated == 0) throw new EntityNotFoundException("Atleta no encontrado");
        return setup;
    }
}
