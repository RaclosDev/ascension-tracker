package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettingsDTO {
    @NotNull(message = "El peso inicial es obligatorio")
    @Min(value = 0, message = "El peso no puede ser negativo")
    private Double startWeight;
    
    @NotNull(message = "El peso objetivo es obligatorio")
    @Min(value = 0, message = "El peso no puede ser negativo")
    private Double goalWeight;
    
    @NotNull(message = "El objetivo semanal es obligatorio")
    private Double weeklyGoal;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;
    
    @NotNull(message = "Las calorias son obligatorias")
    @Min(value = 0, message = "Las calorias no pueden ser negativas")
    private Integer kcal;
    
    private String macroStrategy;
    private Double customProteinPct;
    private Double customFatPct;
    private Double customCarbsPct;
    private Double customProteinGrams;
    private Double customFatGrams;
    private Double customCarbsGrams;
    private Integer age;
    private Integer heightCm;
    private String sex;
    private Double activityFactor;
    private String workoutData;
}
