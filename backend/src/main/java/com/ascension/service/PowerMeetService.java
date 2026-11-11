package com.ascension.service;

import com.ascension.dto.PowerMeetDtos.*;
import com.ascension.exception.EntityNotFoundException;
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
public class PowerMeetService {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RowMapper<Saved> MAPPER = (rs, n) -> new Saved(rs.getObject("id", UUID.class),
            rs.getObject("link_id", UUID.class), JSON.readValue(rs.getString("content"), Content.class),
            rs.getInt("version"), rs.getTimestamp("updated_at").toInstant());
    private final JdbcTemplate jdbc;
    private final CoachAccessPolicy access;

    @Transactional
    public List<Saved> list(String email, UUID linkId) {
        access.require(email, linkId, CoachAccessPolicy.Action.VIEW_POWERLIFTING);
        return jdbc.query("SELECT * FROM coach_powerlifting_meets WHERE link_id = ? ORDER BY content->>'date', id", MAPPER, linkId);
    }

    @Transactional
    public Saved save(String email, UUID linkId, UUID id, SaveRequest request) {
        jdbc.query("SELECT id FROM coach_clients WHERE id = ? FOR UPDATE", (rs, n) -> rs.getObject(1), linkId);
        access.require(email, linkId, CoachAccessPolicy.Action.EDIT_POWERLIFTING);
        validate(request.content());
        if (id == null) {
            if (request.expectedVersion() != 0) throw new InvalidInputException("Una competición nueva debe empezar sin versión previa.");
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM coach_powerlifting_meets WHERE link_id = ?", Integer.class, linkId);
            if (count != null && count >= 100) throw new InvalidInputException("La ficha admite hasta 100 competiciones.");
            id = jdbc.queryForObject("INSERT INTO coach_powerlifting_meets (link_id, content) VALUES (?, CAST(? AS jsonb)) RETURNING id",
                    UUID.class, linkId, JSON.writeValueAsString(request.content()));
        } else {
            Saved previous = get(linkId, id);
            if (previous.version() != request.expectedVersion()) {
                throw new OptimisticLockingFailureException("La competición ha cambiado. Consulta la versión guardada antes de continuar.");
            }
            jdbc.update("UPDATE coach_powerlifting_meets SET content = CAST(? AS jsonb), version = version + 1, updated_at = NOW() WHERE id = ? AND link_id = ?",
                    JSON.writeValueAsString(request.content()), id, linkId);
        }
        return get(linkId, id);
    }

    @Transactional(readOnly = true)
    public List<Saved> exportFor(String email) {
        return jdbc.query("""
                SELECT m.* FROM coach_powerlifting_meets m JOIN coach_clients c ON c.id = m.link_id
                JOIN users u ON u.id = c.coach_user_id OR u.id = c.client_user_id
                WHERE u.email = ? ORDER BY m.content->>'date', m.id
                """, MAPPER, Emails.normalize(email));
    }

    private Saved get(UUID linkId, UUID id) {
        return jdbc.query("SELECT * FROM coach_powerlifting_meets WHERE link_id = ? AND id = ?", MAPPER, linkId, id)
                .stream().findFirst().orElseThrow(() -> new EntityNotFoundException("Competición no encontrada"));
    }

    private void validate(Content content) {
        if (content.attempts().stream().map(a -> a.lift() + ":" + a.number()).distinct().count() != 9) {
            throw new InvalidInputException("Cada levantamiento debe tener tres intentos distintos.");
        }
        for (Attempt attempt : content.attempts()) {
            if ((attempt.result() == Result.VALID || attempt.result() == Result.INVALID) && attempt.actualKg() == null) {
                throw new InvalidInputException("Indica el peso realizado de cada intento válido o nulo.");
            }
        }
        if (content.blocks().stream().map(Block::id).distinct().count() != content.blocks().size()) {
            throw new InvalidInputException("Cada bloque debe tener un identificador distinto.");
        }
        for (Block block : content.blocks()) {
            if (block.start().isAfter(block.end()) || block.end().isAfter(content.date())) {
                throw new InvalidInputException("Cada bloque debe terminar después de empezar y como máximo el día de la competición.");
            }
        }
    }
}
