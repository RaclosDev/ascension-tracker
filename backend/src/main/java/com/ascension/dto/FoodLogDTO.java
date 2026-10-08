package com.ascension.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodLogDTO {
    private Long id;
    
    @NotNull(message = "La fecha no puede ser nula")
    private LocalDate date;
    
    @NotNull(message = "El indice de la comida es requerido")
    private Integer mealIndex;
    
    @NotBlank(message = "El nombre del producto no puede estar vacio")
    private String product;
    
    @Min(value = 0, message = "La cantidad no puede ser negativa")
    private double quantity;
    
    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    private double kcal;
    
    @Min(value = 0, message = "Las proteinas no pueden ser negativas")
    private double protein;
    
    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    private double carbs;
    
    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    private double fat;
    
    private String portionsJson;
}
