package com.ascension.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @Min(value = 0, message = "El índice de la comida no puede ser negativo")
    @Max(value = 20, message = "El índice de la comida está fuera de rango")
    private Integer mealIndex;
    
    @NotBlank(message = "El nombre del producto no puede estar vacio")
    @Size(max = 255, message = "El nombre del producto no puede superar los 255 caracteres")
    private String product;
    
    @Min(value = 0, message = "La cantidad no puede ser negativa")
    @Max(value = 50000, message = "La cantidad no puede superar los 50.000g")
    private double quantity;
    
    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    @Max(value = 50000, message = "Las calorías no pueden superar los 50.000 kcal")
    private double kcal;
    
    @Min(value = 0, message = "Las proteinas no pueden ser negativas")
    @Max(value = 5000, message = "Las proteínas no pueden superar los 5.000g")
    private double protein;
    
    @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
    @Max(value = 5000, message = "Los carbohidratos no pueden superar los 5.000g")
    private double carbs;
    
    @Min(value = 0, message = "Las grasas no pueden ser negativas")
    @Max(value = 5000, message = "Las grasas no pueden superar los 5.000g")
    private double fat;
    
    private String portionsJson;

    @AssertTrue(message = "Los valores nutricionales deben ser números válidos y finitos")
    public boolean isFiniteNumbers() {
        return Double.isFinite(quantity) && Double.isFinite(kcal) &&
               Double.isFinite(protein) && Double.isFinite(carbs) &&
               Double.isFinite(fat);
    }
}
