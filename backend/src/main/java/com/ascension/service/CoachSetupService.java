package com.ascension.service;

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
        if (updated == 0) throw new EntityNotFoundException("Alumno no encontrado");
        return setup;
    }
}
