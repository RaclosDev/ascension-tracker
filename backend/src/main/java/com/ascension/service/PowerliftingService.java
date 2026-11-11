package com.ascension.service;

import com.ascension.dto.PowerliftingDtos.*;
import com.ascension.exception.InvalidInputException;
import com.ascension.util.Emails;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PowerliftingService {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RowMapper<Saved> MAPPER = (rs, n) -> new Saved(
            rs.getObject("link_id", UUID.class), JSON.readValue(rs.getString("content"), Profile.class),
            rs.getInt("version"), rs.getTimestamp("updated_at").toInstant());
    private final JdbcTemplate jdbc;
    private final CoachAccessPolicy access;

    @Transactional
    public Saved get(String email, UUID linkId) {
        access.require(email, linkId, CoachAccessPolicy.Action.VIEW_POWERLIFTING);
        return current(linkId);
    }

    @Transactional
    public Saved save(String email, UUID linkId, SaveRequest request) {
        // Serialize first creation as well as updates against the same relationship.
        jdbc.query("SELECT id FROM coach_clients WHERE id = ? FOR UPDATE", (rs, n) -> rs.getObject(1), linkId);
        access.require(email, linkId, CoachAccessPolicy.Action.EDIT_POWERLIFTING);
        Saved previous = current(linkId);
        if (previous.version() != request.expectedVersion()) {
            throw new OptimisticLockingFailureException("El perfil de powerlifting ha cambiado. Revisa la versión guardada antes de continuar.");
        }
        Profile profile = request.profile();
        if (profile.exerciseMappings() != null && profile.exerciseMappings().stream()
                .map(m -> List.of(m.exerciseId(), m.grip() == null ? "" : m.grip(), m.machine() == null ? "" : m.machine()))
                .distinct().count() != profile.exerciseMappings().size())
            throw new InvalidInputException("Cada variante debe tener una sola clasificación.");
        if (profile.marks().stream().map(Mark::id).distinct().count() != profile.marks().size()) {
            throw new InvalidInputException("Cada marca debe tener un identificador distinto.");
        }
        jdbc.update("""
                INSERT INTO coach_powerlifting_profiles (link_id, content, version)
                VALUES (?, CAST(? AS jsonb), 1)
                ON CONFLICT (link_id) DO UPDATE SET content = EXCLUDED.content,
                    version = coach_powerlifting_profiles.version + 1, updated_at = NOW()
                """, linkId, JSON.writeValueAsString(profile));
        return current(linkId);
    }

    @Transactional(readOnly = true)
    public List<Saved> exportFor(String email) {
        return jdbc.query("""
                SELECT p.* FROM coach_powerlifting_profiles p JOIN coach_clients c ON c.id = p.link_id
                JOIN users u ON u.id = c.coach_user_id OR u.id = c.client_user_id
                WHERE u.email = ? ORDER BY p.link_id
                """, MAPPER, Emails.normalize(email));
    }

    private Saved current(UUID linkId) {
        return jdbc.query("SELECT * FROM coach_powerlifting_profiles WHERE link_id = ?", MAPPER, linkId)
                .stream().findFirst().orElseGet(() -> new Saved(linkId,
                        new Profile(false, Equipment.CLASSIC, "", new Maxes(null, null, null), List.of(), "", List.of()), 0, null));
    }
}
