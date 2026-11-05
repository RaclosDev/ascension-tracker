package com.ascension.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/** A recipe in the coach's library: macros per serving, kcal derived as 4P + 4C + 9F. */
public final class CoachRecipeDtos {

    private CoachRecipeDtos() {
    }

    public record Recipe(UUID id, String name, String description, int kcal, double protein, double carbs,
                         double fat, Instant updatedAt) {
    }

    public record RecipeRequest(
            @NotBlank(message = "Ponle nombre a la receta")
            @Size(max = 120, message = "El nombre no puede pasar de 120 caracteres") String name,
            @Size(max = 2000, message = "La descripción no puede pasar de 2000 caracteres") String description,
            @NotNull(message = "Indica la proteína")
            @DecimalMin(value = "0", message = "Los gramos no pueden ser negativos")
            @DecimalMax(value = "1000", message = "Máximo 1000 g") Double protein,
            @NotNull(message = "Indica los carbohidratos")
            @DecimalMin(value = "0", message = "Los gramos no pueden ser negativos")
            @DecimalMax(value = "1000", message = "Máximo 1000 g") Double carbs,
            @NotNull(message = "Indica la grasa")
            @DecimalMin(value = "0", message = "Los gramos no pueden ser negativos")
            @DecimalMax(value = "1000", message = "Máximo 1000 g") Double fat) {
    }

    public static int kcal(double protein, double carbs, double fat) {
        return (int) Math.round(protein * 4 + carbs * 4 + fat * 9);
    }

    /** Grams are stored with one decimal. */
    public static double grams(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
