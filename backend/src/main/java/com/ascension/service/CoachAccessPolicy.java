package com.ascension.service;

import com.ascension.exception.EntityNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * The single gate for a coach reading a client's data. Every coach endpoint that touches
 * client data resolves the client through {@link #require}; nothing else maps a link to a client.
 * An unknown, foreign or ended link is indistinguishable from a missing one (404), so a coach
 * cannot probe other accounts. A link the client did not grant for this area is a 403.
 */
@Service
public class CoachAccessPolicy {

    public enum Scope { TRAINING, NUTRITION, BODY }

    public enum Action {
        VIEW_WEIGHT(Scope.BODY),
        VIEW_STEPS(Scope.BODY),
        VIEW_WORKOUTS(Scope.TRAINING),
        VIEW_NUTRITION(Scope.NUTRITION),
        VIEW_TARGETS(Scope.NUTRITION);

        private final Scope scope;

        Action(Scope scope) {
            this.scope = scope;
        }

        public Scope scope() {
            return scope;
        }
    }

    /** The client a coach may act on, resolved for one request. */
    public record ClientAccess(UUID linkId, UUID coachUserId, UUID clientUserId, String clientEmail,
                               boolean training, boolean nutrition, boolean body) {
        boolean grants(Scope scope) {
            return switch (scope) {
                case TRAINING -> training;
                case NUTRITION -> nutrition;
                case BODY -> body;
            };
        }
    }

    private final JdbcTemplate jdbcTemplate;

    public CoachAccessPolicy(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public ClientAccess require(String coachEmail, UUID linkId, Action action) {
        if (coachEmail == null || linkId == null) {
            throw new EntityNotFoundException("Alumno no encontrado");
        }
        List<ClientAccess> found = jdbcTemplate.query("""
                SELECT cc.id, cc.coach_user_id, cc.client_user_id, cu.email AS client_email,
                       cc.can_view_training, cc.can_view_nutrition, cc.can_view_body
                FROM coach_clients cc
                JOIN users co ON co.id = cc.coach_user_id
                JOIN users cu ON cu.id = cc.client_user_id
                WHERE cc.id = ? AND co.email = ? AND cc.status = 'ACTIVE'
                """,
                (rs, n) -> new ClientAccess(
                        rs.getObject("id", UUID.class),
                        rs.getObject("coach_user_id", UUID.class),
                        rs.getObject("client_user_id", UUID.class),
                        rs.getString("client_email"),
                        rs.getBoolean("can_view_training"),
                        rs.getBoolean("can_view_nutrition"),
                        rs.getBoolean("can_view_body")),
                linkId, coachEmail.trim().toLowerCase(Locale.ROOT));
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Alumno no encontrado");
        }
        ClientAccess access = found.get(0);
        if (!access.grants(action.scope())) {
            throw new SecurityException("Coach link " + linkId + " does not grant " + action.scope());
        }
        jdbcTemplate.update("""
                INSERT INTO coach_access_log (coach_user_id, client_user_id, action, access_date)
                VALUES (?, ?, ?, CURRENT_DATE)
                ON CONFLICT (client_user_id, coach_user_id, action, access_date)
                DO UPDATE SET hits = coach_access_log.hits + 1, last_at = NOW()
                """, access.coachUserId(), access.clientUserId(), action.name());
        return access;
    }
}
