package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiApplyRequestDTO {

    @NotBlank(message = "La fecha es obligatoria")
    private String date;

    @Min(value = 0, message = "El índice de la comida no puede ser negativo")
    @Max(value = 20, message = "El índice de la comida está fuera de rango")
    private Integer mealIndex;

    @NotEmpty(message = "La lista de alimentos no puede estar vacía")
    @Size(max = 50, message = "No se pueden añadir más de 50 alimentos a la vez")
    @Valid
    private List<AppliedFoodItemDTO> foods;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppliedFoodItemDTO {

        @Min(value = 0, message = "El índice de la comida no puede ser negativo")
        @Max(value = 20, message = "El índice de la comida está fuera de rango")
        private Integer mealIndex;

        @NotBlank(message = "El nombre del producto no puede estar vacío")
        @Size(max = 255, message = "El nombre del producto no puede superar los 255 caracteres")
        private String product;

        @Min(value = 0, message = "La cantidad no puede ser negativa")
        @Max(value = 50000, message = "La cantidad no puede superar los 50.000g")
        private double quantity;

        @Min(value = 0, message = "Las calorías no pueden ser negativas")
        @Max(value = 50000, message = "Las calorías no pueden superar los 50.000 kcal")
        private double kcal;

        @Min(value = 0, message = "Las proteínas no pueden ser negativas")
        @Max(value = 5000, message = "Las proteínas no pueden superar los 5.000g")
        private double protein;

        @Min(value = 0, message = "Los carbohidratos no pueden ser negativos")
        @Max(value = 5000, message = "Los carbohidratos no pueden superar los 5.000g")
        private double carbs;

        @Min(value = 0, message = "Las grasas no pueden ser negativas")
        @Max(value = 5000, message = "Las grasas no pueden superar los 5.000g")
        private double fat;

        private String portionsJson;

        @AssertTrue(message = "Los valores nutricionales deben ser números finitos válidos")
        public boolean isFiniteNumbers() {
            return Double.isFinite(quantity) && Double.isFinite(kcal) &&
                   Double.isFinite(protein) && Double.isFinite(carbs) &&
                   Double.isFinite(fat);
        }
    }
}
