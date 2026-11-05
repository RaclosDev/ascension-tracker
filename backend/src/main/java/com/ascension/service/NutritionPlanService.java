package com.ascension.service;

import com.ascension.dto.CoachDtos.Person;
import com.ascension.dto.NutritionPlanDtos.DayRequest;
import com.ascension.dto.NutritionPlanDtos.DayTargets;
import com.ascension.dto.NutritionPlanDtos.NutritionPlan;
import com.ascension.dto.NutritionPlanDtos.PlanExport;
import com.ascension.dto.NutritionPlanDtos.PlanRequest;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Nutrition targets a coach sets for a client. Every change ends the plan in force and starts a
 * new one, so the history of what was prescribed is kept. A plan is only in force while the link
 * it was set through is active and still lets the coach edit nutrition.
 */
@Service
public class NutritionPlanService {

    private static final String COLUMNS = """
            p.id, p.training_protein, p.training_carbs, p.training_fat, p.rest_protein, p.rest_carbs, p.rest_fat,
            p.notes, p.status, p.created_at, p.ended_at
            """;

    private final JdbcTemplate jdbcTemplate;

    public NutritionPlanService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** The plan this coach set through this link, if it is the one in force. */
    @Transactional(readOnly = true)
    public Optional<NutritionPlan> current(ClientAccess access) {
        return jdbcTemplate.query("""
                SELECT %s, u.name, u.email, u.picture FROM nutrition_plans p
                LEFT JOIN users u ON u.id = p.coach_user_id
                WHERE p.coach_link_id = ? AND p.client_user_id = ? AND p.status = 'ACTIVE'
                """.formatted(COLUMNS), PLAN, access.linkId(), access.clientUserId()).stream().findFirst();
    }

    @Transactional
    public NutritionPlan set(ClientAccess access, PlanRequest request) {
        requireCalories(request.training(), "entreno");
        requireCalories(request.rest(), "descanso");
        endActive(access.clientUserId());
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().strip();
        jdbcTemplate.update("""
                INSERT INTO nutrition_plans (client_user_id, coach_user_id, coach_link_id,
                    training_protein, training_carbs, training_fat, rest_protein, rest_carbs, rest_fat, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
                """, access.clientUserId(), access.coachUserId(), access.linkId(),
                request.training().protein(), request.training().carbs(), request.training().fat(),
                request.rest().protein(), request.rest().carbs(), request.rest().fat(), notes);
        return current(access).orElseThrow();
    }

    /** The coach stops setting targets; the client's own settings apply again. */
    @Transactional
    public void end(ClientAccess access) {
        int updated = jdbcTemplate.update("""
                UPDATE nutrition_plans SET status = 'ENDED', ended_at = NOW()
                WHERE coach_link_id = ? AND client_user_id = ? AND status = 'ACTIVE'
                """, access.linkId(), access.clientUserId());
        if (updated == 0) {
            throw new EntityNotFoundException("Plan de nutrición no encontrado");
        }
    }

    /** The plan in force for this user, from a coach they still let edit their nutrition. */
    @Transactional(readOnly = true)
    public Optional<NutritionPlan> inForce(String email) {
        return jdbcTemplate.query("""
                SELECT %s, co.name, co.email, co.picture FROM nutrition_plans p
                JOIN users cu ON cu.id = p.client_user_id
                JOIN coach_clients cc ON cc.id = p.coach_link_id
                JOIN users co ON co.id = cc.coach_user_id
                WHERE cu.email = ? AND p.status = 'ACTIVE'
                  AND cc.status = 'ACTIVE' AND cc.can_view_nutrition AND cc.can_edit_nutrition
                """.formatted(COLUMNS), PLAN, normalize(email)).stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<PlanExport> exportFor(UUID userId) {
        return jdbcTemplate.query("""
                SELECT %s, CASE WHEN p.client_user_id = ? THEN 'CLIENT' ELSE 'COACH' END AS role,
                       u.name, u.email, u.picture
                FROM nutrition_plans p
                LEFT JOIN users u ON u.id = CASE WHEN p.client_user_id = ? THEN p.coach_user_id
                                                 ELSE p.client_user_id END
                WHERE p.client_user_id = ? OR p.coach_user_id = ?
                ORDER BY p.created_at
                """.formatted(COLUMNS),
                (rs, n) -> new PlanExport(rs.getObject("id", UUID.class), rs.getString("role"),
                        rs.getString("email") == null ? null : person(rs), training(rs), rest(rs),
                        rs.getString("notes"), rs.getString("status"), instant(rs, "created_at"),
                        instant(rs, "ended_at")),
                userId, userId, userId, userId);
    }

    private void endActive(UUID clientUserId) {
        jdbcTemplate.update("""
                UPDATE nutrition_plans SET status = 'ENDED', ended_at = NOW()
                WHERE client_user_id = ? AND status = 'ACTIVE'
                """, clientUserId);
    }

    private static void requireCalories(DayRequest day, String label) {
        if (day.protein() + day.carbs() + day.fat() == 0) {
            throw new InvalidInputException("Pon algún objetivo para los días de " + label + ".");
        }
    }

    private static final RowMapper<NutritionPlan> PLAN = (rs, n) -> new NutritionPlan(
            rs.getObject("id", UUID.class), rs.getString("email") == null ? null : person(rs),
            training(rs), rest(rs), rs.getString("notes"), instant(rs, "created_at"));

    private static DayTargets training(ResultSet rs) throws SQLException {
        return DayTargets.of(rs.getInt("training_protein"), rs.getInt("training_carbs"), rs.getInt("training_fat"));
    }

    private static DayTargets rest(ResultSet rs) throws SQLException {
        return DayTargets.of(rs.getInt("rest_protein"), rs.getInt("rest_carbs"), rs.getInt("rest_fat"));
    }

    private static Person person(ResultSet rs) throws SQLException {
        return new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }

    private static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
