package com.ascension.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MealDTO {
    private Long id;
    @Size(max = 36)
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String mealKey;
    
    @NotBlank(message = "El nombre de la comida es requerido")
    @Size(max = 100, message = "El nombre de la comida no puede superar 100 caracteres")
    private String name;
    
    @Size(max = 50, message = "El icono no puede superar 50 caracteres")
    private String icon;

    @Min(value = 0, message = "El porcentaje no puede ser negativo")
    @Max(value = 100, message = "El porcentaje no puede superar 100")
    private Double proteinPct;

    @Min(value = 0, message = "El valor fijo no puede ser negativo")
    @Max(value = 5000, message = "El valor fijo no puede superar 5000g")
    private Double fixedProtein;

    @Min(value = 0, message = "El porcentaje no puede ser negativo")
    @Max(value = 100, message = "El porcentaje no puede superar 100")
    private Double carbsPct;

    @Min(value = 0, message = "El valor fijo no puede ser negativo")
    @Max(value = 5000, message = "El valor fijo no puede superar 5000g")
    private Double fixedCarbs;

    @Min(value = 0, message = "El porcentaje no puede ser negativo")
    @Max(value = 100, message = "El porcentaje no puede superar 100")
    private Double fatPct;

    @Min(value = 0, message = "El valor fijo no puede ser negativo")
    @Max(value = 5000, message = "El valor fijo no puede superar 5000g")
    private Double fixedFat;

    @Min(value = 0)
    @Max(value = 50)
    private Integer sortOrder;

    @Size(max = 10)
    private String startTime;

    @Size(max = 10)
    private String endTime;

    private Boolean isDefault;
}
