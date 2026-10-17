package com.ascension.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 200, message = "El nombre de la receta no puede superar 200 caracteres")
    private String name;

    @Size(max = 5000, message = "La descripción no puede superar 5000 caracteres")
    private String description;

    @Min(value = 0, message = "Las calorías no pueden ser negativas")
    @Max(value = 100000, message = "Las calorías no pueden superar 100000")
    private double totalKcal;

    @Min(value = 0, message = "Las proteínas no pueden ser negativas")
    @Max(value = 10000, message = "Las proteínas no pueden superar 10000g")
    private double totalProtein;

    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    @Max(value = 10000, message = "Los carbohidratos no pueden superar 10000g")
    private double totalCarbs;

    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    @Max(value = 10000, message = "Las grasas no pueden superar 10000g")
    private double totalFat;
}
