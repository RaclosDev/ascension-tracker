package com.ascension.service;

import com.ascension.dto.CoachRecipeDtos;
import com.ascension.dto.CoachRecipeDtos.Recipe;
import com.ascension.dto.CoachRecipeDtos.RecipeRequest;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * The coach's recipe library. Every query is scoped to the coach's own rows, so another coach's
 * recipe id behaves exactly like an unknown one: 404.
 */
@Service
public class CoachRecipeService {

    static final int MAX_LIBRARY_RECIPES = 300;
    private static final String COLUMNS = "r.id, r.name, r.description, r.protein, r.carbs, r.fat, r.updated_at";
    private static final RowMapper<Recipe> MAPPER = (rs, n) -> {
        double protein = rs.getDouble("protein");
        double carbs = rs.getDouble("carbs");
        double fat = rs.getDouble("fat");
        return new Recipe(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("description"),
                CoachRecipeDtos.kcal(protein, carbs, fat), protein, carbs, fat,
                rs.getTimestamp("updated_at").toInstant());
    };

    private final JdbcTemplate jdbcTemplate;
    private final CoachService coachService;

    public CoachRecipeService(JdbcTemplate jdbcTemplate, CoachService coachService) {
        this.jdbcTemplate = jdbcTemplate;
        this.coachService = coachService;
    }

    public List<Recipe> list(String coachEmail) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        return jdbcTemplate.query("SELECT " + COLUMNS + " FROM coach_recipes r WHERE r.coach_user_id = ?"
                + " ORDER BY LOWER(r.name), r.created_at", MAPPER, coachId);
    }

    @Transactional
    public Recipe create(String coachEmail, RecipeRequest request) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        // Serialises creations per coach so the library cap holds under concurrent requests.
        jdbcTemplate.queryForObject("SELECT user_id FROM coach_profiles WHERE user_id = ? FOR UPDATE",
                UUID.class, coachId);
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM coach_recipes WHERE coach_user_id = ?", Integer.class, coachId);
        if (count != null && count >= MAX_LIBRARY_RECIPES) {
            throw new InvalidInputException("Has alcanzado el máximo de recetas en tu biblioteca.");
        }
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO coach_recipes (coach_user_id, name, description, protein, carbs, fat)
                VALUES (?, ?, ?, ?, ?, ?) RETURNING id
                """, UUID.class, coachId, request.name().trim(), blankToNull(request.description()),
                CoachRecipeDtos.grams(request.protein()), CoachRecipeDtos.grams(request.carbs()),
                CoachRecipeDtos.grams(request.fat()));
        return require(coachId, id);
    }

    @Transactional
    public Recipe update(String coachEmail, UUID recipeId, RecipeRequest request) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        int updated = jdbcTemplate.update("""
                UPDATE coach_recipes SET name = ?, description = ?, protein = ?, carbs = ?, fat = ?,
                       updated_at = NOW()
                WHERE id = ? AND coach_user_id = ?
                """, request.name().trim(), blankToNull(request.description()),
                CoachRecipeDtos.grams(request.protein()), CoachRecipeDtos.grams(request.carbs()),
                CoachRecipeDtos.grams(request.fat()), recipeId, coachId);
        if (updated == 0) {
            throw new EntityNotFoundException("Receta no encontrada");
        }
        return require(coachId, recipeId);
    }

    @Transactional
    public void delete(String coachEmail, UUID recipeId) {
        UUID coachId = coachService.requireCoachId(coachEmail);
        if (jdbcTemplate.update("DELETE FROM coach_recipes WHERE id = ? AND coach_user_id = ?",
                recipeId, coachId) == 0) {
            throw new EntityNotFoundException("Receta no encontrada");
        }
    }

    /** One of this coach's recipes, or 404: a meal plan copies it from here. */
    public Recipe require(UUID coachId, UUID recipeId) {
        return find(coachId, recipeId).orElseThrow(() -> new EntityNotFoundException("Receta no encontrada"));
    }

    /** Every recipe this account keeps as a coach, for the GDPR export. */
    public List<Recipe> exportFor(String email) {
        return jdbcTemplate.query("SELECT " + COLUMNS + " FROM coach_recipes r JOIN users u ON u.id = r.coach_user_id"
                + " WHERE u.email = ? ORDER BY r.created_at", MAPPER,
                email == null ? null : email.trim().toLowerCase(Locale.ROOT));
    }

    private Optional<Recipe> find(UUID coachId, UUID recipeId) {
        return jdbcTemplate.query("SELECT " + COLUMNS + " FROM coach_recipes r WHERE r.id = ? AND r.coach_user_id = ?",
                MAPPER, recipeId, coachId).stream().findFirst();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
