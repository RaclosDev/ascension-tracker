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
public class SavedFoodDTO {
    private Long id;

    @NotBlank(message = "El nombre no puede estar vacio")
    @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
    private String name;

    @Size(max = 200, message = "La marca no puede superar 200 caracteres")
    private String brand;

    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    @Max(value = 10000, message = "Las calorias no pueden superar 10000 por 100g")
    private double kcalPer100g;

    @Min(value = 0, message = "Las proteinas no pueden ser negativas")
    @Max(value = 100, message = "Las proteinas no pueden superar 100g por 100g")
    private double proteinPer100g;

    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    @Max(value = 100, message = "Los carbohidratos no pueden superar 100g por 100g")
    private double carbsPer100g;

    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    @Max(value = 100, message = "Las grasas no pueden superar 100g por 100g")
    private double fatPer100g;

    @Min(value = 0, message = "El tamaño de porcion no puede ser negativo")
    @Max(value = 10000, message = "El tamaño de porcion no puede superar 10000g")
    private Double servingSize;    // grams per unit (e.g. 125 for a yogurt cup)

    @Size(max = 100, message = "La etiqueta no puede superar 100 caracteres")
    private String servingLabel;   // e.g. "envase", "unidad", "tarrina"
}
