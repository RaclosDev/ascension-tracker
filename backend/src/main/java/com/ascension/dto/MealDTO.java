package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MealDTO {
    private Long id;
    
    @NotBlank(message = "El nombre de la comida es requerido")
    private String name;
    
    private String icon;
    @jakarta.validation.constraints.Min(value = 0)
    @jakarta.validation.constraints.Max(value = 100)
    private Double proteinPct;
    private Double fixedProtein;
    @jakarta.validation.constraints.Min(value = 0)
    @jakarta.validation.constraints.Max(value = 100)
    private Double carbsPct;
    private Double fixedCarbs;
    @jakarta.validation.constraints.Min(value = 0)
    @jakarta.validation.constraints.Max(value = 100)
    private Double fatPct;
    private Double fixedFat;
    private Integer sortOrder;
    private String startTime;
    private String endTime;
    private Boolean isDefault;
}
