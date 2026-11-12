package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.CoachDtos.Person;
import com.ascension.dto.NutritionPlanDtos.DayRequest;
import com.ascension.dto.CoachRecipeDtos;
import com.ascension.dto.CoachRecipeDtos.Recipe;
import com.ascension.dto.NutritionPlanDtos.DayTargets;
import com.ascension.dto.NutritionPlanDtos.MealRequest;
import com.ascension.dto.NutritionPlanDtos.NutritionPlan;
import com.ascension.dto.NutritionPlanDtos.PlanExport;
import com.ascension.dto.NutritionPlanDtos.PlanRequest;
import com.ascension.dto.NutritionPlanDtos.PlannedMeal;
import com.ascension.dto.NutritionPlanDtos.PublishRequest;
import com.ascension.dto.NutritionPlanDtos.PlanVersion;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
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
    private final CoachRecipeService recipeService;

    // Lazy: CoachService needs this service and the recipe service needs CoachService.
    public NutritionPlanService(JdbcTemplate jdbcTemplate, @Lazy CoachRecipeService recipeService) {
        this.jdbcTemplate = jdbcTemplate;
        this.recipeService = recipeService;
    }

    /** The plan this coach set through this link, if it is the one in force. */
    @Transactional(readOnly = true)
    public Optional<NutritionPlan> current(ClientAccess access) {
        return jdbcTemplate.query("""
                SELECT %s, u.name, u.email, u.picture FROM nutrition_plans p
                LEFT JOIN coach_public_profiles u ON u.id = p.coach_user_id
                WHERE p.coach_link_id = ? AND p.client_user_id = ? AND p.status = 'ACTIVE'
                """.formatted(COLUMNS), PLAN, access.linkId(), access.clientUserId()).stream().findFirst()
                .map(this::withMeals);
    }

    @Transactional
    public NutritionPlan set(ClientAccess access, PlanRequest request) {
        lockClient(access.clientUserId());
        requireOwnActivePlan(access);
        requireCalories(request.training(), "entreno");
        requireCalories(request.rest(), "descanso");
        List<MealRequest> meals = request.meals() == null ? List.of() : request.meals();
        // Copies the coach's own recipes first: another coach's recipe id is a 404, as an unknown one.
        List<Recipe> recipes = meals.stream().map(m -> recipeService.require(access.coachUserId(), m.recipeId()))
                .toList();
        for (int i = 0; i < meals.size(); i++) {
            Instant expected = meals.get(i).expectedRecipeUpdatedAt();
            if (expected != null && !expected.equals(recipes.get(i).updatedAt())) {
                throw new OptimisticLockingFailureException(
                        "Una receta ha cambiado. Actualiza las recetas y revisa la vista previa antes de publicar.");
            }
        }
        endActive(access.clientUserId());
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().strip();
        UUID planId = jdbcTemplate.queryForObject("""
                INSERT INTO nutrition_plans (client_user_id, coach_user_id, coach_link_id,
                    training_protein, training_carbs, training_fat, rest_protein, rest_carbs, rest_fat, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE') RETURNING id
                """, UUID.class, access.clientUserId(), access.coachUserId(), access.linkId(),
                request.training().protein(), request.training().carbs(), request.training().fat(),
                request.rest().protein(), request.rest().carbs(), request.rest().fat(), notes);
        Map<String, Integer> positions = new HashMap<>();
        for (int i = 0; i < meals.size(); i++) {
            MealRequest meal = meals.get(i);
            Recipe recipe = recipes.get(i);
            jdbcTemplate.update("""
                    INSERT INTO nutrition_plan_meals (plan_id, day_type, position, slot_name, recipe_id, recipe_name,
                        recipe_description, servings, protein, carbs, fat)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, planId, meal.dayType(), positions.merge(meal.dayType(), 1, Integer::sum),
                    meal.slotName().strip(), recipe.id(), recipe.name(), recipe.description(),
                    Math.round(meal.servings() * 100) / 100.0, recipe.protein(), recipe.carbs(), recipe.fat());
        }
        return current(access).orElseThrow();
    }

    /** The coach stops setting targets; the client's own settings apply again. */
    @Transactional
    public void end(ClientAccess access) {
        lockClient(access.clientUserId());
        int updated = jdbcTemplate.update("""
                UPDATE nutrition_plans SET status = 'ENDED', ended_at = NOW()
                WHERE coach_link_id = ? AND client_user_id = ? AND status = 'ACTIVE'
                """, access.linkId(), access.clientUserId());
        if (updated == 0) {
            throw new EntityNotFoundException("Plan de nutrición no encontrado");
        }
    }

    @Transactional
    public NutritionPlan publish(ClientAccess access, PublishRequest request) {
        requireCurrentVersion(access, request.expectedPlanId());
        return set(access, request.plan());
    }

    @Transactional
    public void endVersion(ClientAccess access, UUID planId) {
        requireCurrentVersion(access, planId);
        end(access);
    }

    private void lockClient(UUID clientId) {
        jdbcTemplate.queryForObject("SELECT id FROM users WHERE id = ? FOR UPDATE", UUID.class, clientId);
    }

    private void requireCurrentVersion(ClientAccess access, UUID expectedId) {
        lockClient(access.clientUserId());
        UUID actualId = requireOwnActivePlan(access);
        if (!Objects.equals(expectedId, actualId)) {
            throw new OptimisticLockingFailureException(
                    "La pauta activa ha cambiado. Actualiza la ficha antes de publicar o retirar una versión.");
        }
    }

    private UUID requireOwnActivePlan(ClientAccess access) {
        List<UUID> active = jdbcTemplate.queryForList(
                "SELECT id FROM nutrition_plans WHERE client_user_id = ? AND status = 'ACTIVE'", UUID.class,
                access.clientUserId());
        UUID actualId = active.isEmpty() ? null : active.getFirst();
        boolean own = actualId == null || Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT coach_link_id = ? FROM nutrition_plans WHERE id = ?", Boolean.class,
                access.linkId(), actualId));
        if (!own) {
            throw new OptimisticLockingFailureException(
                    "El atleta tiene una pauta activa de otro entrenador. Debe finalizarse antes de publicar otra.");
        }
        return actualId;
    }

    @Transactional(readOnly = true)
    public List<PlanVersion> history(ClientAccess access) {
        return jdbcTemplate.query("""
                SELECT %s FROM nutrition_plans p WHERE p.coach_link_id = ? AND p.client_user_id = ?
                ORDER BY p.created_at DESC, p.id DESC LIMIT 20
                """.formatted(COLUMNS), (rs, n) -> new PlanVersion(
                rs.getObject("id", UUID.class), training(rs), rest(rs), rs.getString("status"),
                instant(rs, "created_at"), instant(rs, "ended_at")), access.linkId(), access.clientUserId());
    }

    @Transactional(readOnly = true)
    public NutritionPlan version(ClientAccess access, UUID planId) {
        return jdbcTemplate.query("""
                SELECT %s, u.name, u.email, u.picture FROM nutrition_plans p
                LEFT JOIN coach_public_profiles u ON u.id = p.coach_user_id
                WHERE p.id = ? AND p.coach_link_id = ? AND p.client_user_id = ?
                """.formatted(COLUMNS), PLAN, planId, access.linkId(), access.clientUserId()).stream().findFirst()
                .map(this::withMeals).orElseThrow(() -> new EntityNotFoundException("Pauta no encontrada"));
    }

    /** The plan in force for this user, from a coach they still let edit their nutrition. */
    @Transactional(readOnly = true)
    public Optional<NutritionPlan> inForce(String email) {
        return jdbcTemplate.query("""
                SELECT %s, co.name, co.email, co.picture FROM nutrition_plans p
                JOIN users cu ON cu.id = p.client_user_id
                JOIN coach_clients cc ON cc.id = p.coach_link_id
                JOIN coach_public_profiles co ON co.id = cc.coach_user_id
                WHERE cu.email = ? AND p.status = 'ACTIVE'
                  AND cc.status = 'ACTIVE' AND cc.can_view_nutrition AND cc.can_edit_nutrition
                """.formatted(COLUMNS), PLAN, Emails.normalize(email)).stream().findFirst().map(this::withMeals);
    }

    @Transactional(readOnly = true)
    public List<PlanExport> exportFor(UUID userId) {
        return jdbcTemplate.query("""
                SELECT %s, CASE WHEN p.client_user_id = ? THEN 'CLIENT' ELSE 'COACH' END AS role,
                       COALESCE(cp.name, u.name) AS name, u.email, CASE WHEN cp.id IS NULL THEN u.picture ELSE cp.picture END AS picture
                FROM nutrition_plans p
                LEFT JOIN users u ON u.id = CASE WHEN p.client_user_id = ? THEN p.coach_user_id
                                                 ELSE p.client_user_id END
                LEFT JOIN coach_public_profiles cp ON cp.id = u.id AND cp.id = p.coach_user_id
                WHERE p.client_user_id = ? OR p.coach_user_id = ?
                ORDER BY p.created_at
                """.formatted(COLUMNS),
                (rs, n) -> new PlanExport(rs.getObject("id", UUID.class), rs.getString("role"),
                        rs.getString("email") == null ? null : person(rs), training(rs), rest(rs),
                        rs.getString("notes"), rs.getString("status"), instant(rs, "created_at"),
                        instant(rs, "ended_at"), List.of()),
                userId, userId, userId, userId).stream()
                .map(p -> new PlanExport(p.id(), p.role(), p.other(), p.training(), p.rest(), p.notes(), p.status(),
                        p.createdAt(), p.endedAt(), meals(p.id())))
                .toList();
    }

    private NutritionPlan withMeals(NutritionPlan plan) {
        return new NutritionPlan(plan.id(), plan.coach(), plan.training(), plan.rest(), plan.notes(),
                plan.createdAt(), meals(plan.id()));
    }

    /** Training meals first, each kind of day in the coach's order; macros cover all the servings. */
    private List<PlannedMeal> meals(UUID planId) {
        return jdbcTemplate.query("""
                SELECT day_type, slot_name, recipe_id, recipe_name, recipe_description, servings, protein, carbs, fat
                FROM nutrition_plan_meals WHERE plan_id = ? ORDER BY day_type DESC, position
                """, (rs, n) -> {
            double servings = rs.getDouble("servings");
            double protein = CoachRecipeDtos.grams(rs.getDouble("protein") * servings);
            double carbs = CoachRecipeDtos.grams(rs.getDouble("carbs") * servings);
            double fat = CoachRecipeDtos.grams(rs.getDouble("fat") * servings);
            return new PlannedMeal(rs.getString("day_type"), rs.getString("slot_name"),
                    rs.getObject("recipe_id", UUID.class), rs.getString("recipe_name"),
                    rs.getString("recipe_description"), servings, CoachRecipeDtos.kcal(protein, carbs, fat),
                    protein, carbs, fat);
        }, planId);
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
            training(rs), rest(rs), rs.getString("notes"), instant(rs, "created_at"), List.of());

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

}
