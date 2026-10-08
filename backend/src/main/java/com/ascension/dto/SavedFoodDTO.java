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
public class SavedFoodDTO {
    private Long id;

    @NotBlank(message = "El nombre no puede estar vacio")
    private String name;

    private String brand;

    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    private double kcalPer100g;

    @Min(value = 0, message = "Las proteinas no pueden ser negativas")
    private double proteinPer100g;

    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    private double carbsPer100g;

    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    private double fatPer100g;

    @Min(value = 0, message = "El tamaño de porcion no puede ser negativo")
    private Double servingSize;    // grams per unit (e.g. 125 for a yogurt cup)

    private String servingLabel;   // e.g. "envase", "unidad", "tarrina"
}
