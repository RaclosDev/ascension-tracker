package com.ascension.service;

import com.ascension.dto.CoachRecipeDtos;
import com.ascension.dto.NutritionPlanDtos.DayRequest;
import com.ascension.dto.NutritionPlanDtos.DayTargets;
import com.ascension.dto.NutritionPlanDtos.PlannedMeal;
import com.ascension.dto.NutritionTemplateDtos.Content;
import com.ascension.dto.NutritionTemplateDtos.SaveRequest;
import com.ascension.dto.NutritionTemplateDtos.Summary;
import com.ascension.dto.NutritionTemplateDtos.Template;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.util.Emails;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class NutritionTemplateService {
    private static final int MAX_TEMPLATES = 100;
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final RowMapper<Template> MAPPER = (rs, n) -> new Template(
            rs.getObject("id", UUID.class), rs.getString("name"),
            JSON.readValue(rs.getString("content"), Content.class), rs.getInt("version"),
            rs.getTimestamp("updated_at").toInstant());
    private final JdbcTemplate jdbc;
    private final CoachService coaches;
    private final CoachRecipeService recipes;

    public NutritionTemplateService(JdbcTemplate jdbc, CoachService coaches, CoachRecipeService recipes) {
        this.jdbc = jdbc;
        this.coaches = coaches;
        this.recipes = recipes;
    }

    @Transactional(readOnly = true)
    public List<Summary> list(String email) {
        UUID owner = coaches.requireCoachId(email);
        return jdbc.query("""
                SELECT id, name, version, updated_at,
                    (content->'training'->>'kcal')::integer AS training_kcal,
                    (content->'rest'->>'kcal')::integer AS rest_kcal
                FROM coach_nutrition_templates WHERE coach_user_id = ? ORDER BY LOWER(name), id
                """, (rs, n) -> new Summary(rs.getObject("id", UUID.class), rs.getString("name"),
                rs.getInt("training_kcal"), rs.getInt("rest_kcal"), rs.getInt("version"),
                rs.getTimestamp("updated_at").toInstant()), owner);
    }

    @Transactional(readOnly = true)
    public Template get(String email, UUID id) {
        return require(coaches.requireCoachId(email), id, false);
    }

    @Transactional
    public Template create(String email, SaveRequest request) {
        UUID owner = coaches.requireCoachId(email);
        jdbc.queryForObject("SELECT user_id FROM coach_profiles WHERE user_id = ? FOR UPDATE", UUID.class, owner);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM coach_nutrition_templates WHERE coach_user_id = ?",
                Integer.class, owner);
        if (count != null && count >= MAX_TEMPLATES) {
            throw new InvalidInputException("Tu biblioteca admite hasta 100 pautas. Borra alguna antes de crear otra.");
        }
        Content content = snapshot(owner, request);
        UUID id = jdbc.queryForObject("""
                INSERT INTO coach_nutrition_templates (coach_user_id, name, content)
                VALUES (?, ?, CAST(? AS jsonb)) RETURNING id
                """, UUID.class, owner, request.name().strip(), JSON.writeValueAsString(content));
        return require(owner, id, false);
    }

    @Transactional
    public Template update(String email, UUID id, SaveRequest request) {
        UUID owner = coaches.requireCoachId(email);
        Template current = require(owner, id, true);
        checkVersion(current, request.expectedVersion());
        Content content = snapshot(owner, request);
        jdbc.update("""
                UPDATE coach_nutrition_templates SET name = ?, content = CAST(? AS jsonb),
                    version = version + 1, updated_at = NOW() WHERE id = ? AND coach_user_id = ?
                """, request.name().strip(), JSON.writeValueAsString(content), id, owner);
        return require(owner, id, false);
    }

    @Transactional
    public void delete(String email, UUID id, int expectedVersion) {
        UUID owner = coaches.requireCoachId(email);
        checkVersion(require(owner, id, true), expectedVersion);
        jdbc.update("DELETE FROM coach_nutrition_templates WHERE id = ? AND coach_user_id = ?", id, owner);
    }

    @Transactional(readOnly = true)
    public List<Template> exportFor(String email) {
        return jdbc.query("""
                SELECT t.* FROM coach_nutrition_templates t JOIN users u ON u.id = t.coach_user_id
                WHERE u.email = ? ORDER BY t.created_at, t.id
                """, MAPPER, Emails.normalize(email));
    }

    private Template require(UUID owner, UUID id, boolean lock) {
        return jdbc.query("SELECT * FROM coach_nutrition_templates WHERE id = ? AND coach_user_id = ?"
                        + (lock ? " FOR UPDATE" : ""), MAPPER, id, owner).stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Pauta de biblioteca no encontrada"));
    }

    private void checkVersion(Template current, Integer expected) {
        if (!Objects.equals(current.version(), expected)) {
            throw new OptimisticLockingFailureException(
                    "La pauta de biblioteca ha cambiado. Revisa la versión guardada o conserva tus cambios como una nueva.");
        }
    }

    private Content snapshot(UUID owner, SaveRequest request) {
        var plan = request.plan();
        List<PlannedMeal> meals = plan.meals() == null ? List.of() : plan.meals().stream().map(meal -> {
            var recipe = recipes.require(owner, meal.recipeId());
            double servings = Math.round(meal.servings() * 100) / 100.0;
            double protein = CoachRecipeDtos.grams(recipe.protein() * servings);
            double carbs = CoachRecipeDtos.grams(recipe.carbs() * servings);
            double fat = CoachRecipeDtos.grams(recipe.fat() * servings);
            return new PlannedMeal(meal.dayType(), meal.slotName().strip(), recipe.id(), recipe.name(),
                    recipe.description(), servings, CoachRecipeDtos.kcal(protein, carbs, fat), protein, carbs, fat);
        }).toList();
        return new Content(targets(plan.training()), targets(plan.rest()),
                plan.notes() == null || plan.notes().isBlank() ? null : plan.notes().strip(), meals);
    }

    private DayTargets targets(DayRequest request) {
        DayTargets targets = DayTargets.of(request.protein(), request.carbs(), request.fat());
        if (targets.kcal() <= 0) throw new InvalidInputException("Cada tipo de día debe tener al menos un macro mayor que cero.");
        return targets;
    }
}
