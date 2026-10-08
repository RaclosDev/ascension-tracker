package com.ascension.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDTO {
    private Long id;

    @NotBlank(message = "El nombre de la receta es requerido")
    private String name;

    private String description;

    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    private double totalKcal;

    @Min(value = 0, message = "Las proteinas no pueden ser negativas")
    private double totalProtein;

    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    private double totalCarbs;

    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    private double totalFat;
}
