package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettingsDTO {
    @NotNull(message = "El peso inicial es obligatorio")
    @DecimalMin(value = "1.0", message = "El peso inicial debe ser superior a 0")
    @DecimalMax(value = "1000.0", message = "El peso inicial no puede superar 1000kg")
    private Double startWeight;
    
    @NotNull(message = "El peso objetivo es obligatorio")
    @DecimalMin(value = "1.0", message = "El peso objetivo debe ser superior a 0")
    @DecimalMax(value = "1000.0", message = "El peso objetivo no puede superar 1000kg")
    private Double goalWeight;
    
    @NotNull(message = "El objetivo semanal es obligatorio")
    @DecimalMin(value = "-5.0", message = "El objetivo semanal no puede ser inferior a -5kg")
    @DecimalMax(value = "5.0", message = "El objetivo semanal no puede superar 5kg")
    private Double weeklyGoal;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate startDate;
    
    @NotNull(message = "Las calorías son obligatorias")
    @Min(value = 500, message = "Las calorías no pueden ser inferiores a 500")
    @Max(value = 20000, message = "Las calorías no pueden superar 20000")
    private Integer kcal;
    
    @Size(max = 50, message = "La estrategia de macros no puede superar 50 caracteres")
    private String macroStrategy;

    @Min(0) @Max(100)
    private Double customProteinPct;

    @Min(0) @Max(100)
    private Double customFatPct;

    @Min(0) @Max(100)
    private Double customCarbsPct;

    @Min(0) @Max(5000)
    private Double customProteinGrams;

    @Min(0) @Max(5000)
    private Double customFatGrams;

    @Min(0) @Max(5000)
    private Double customCarbsGrams;

    @Min(value = 10, message = "La edad debe ser mayor de 10")
    @Max(value = 120, message = "La edad no puede superar 120")
    private Integer age;

    @Min(value = 50, message = "La altura debe ser superior a 50cm")
    @Max(value = 300, message = "La altura no puede superar 300cm")
    private Integer heightCm;

    @Pattern(regexp = "^[MF]?$", message = "El sexo debe ser 'M', 'F' o vacío")
    private String sex;

    @DecimalMin(value = "1.0", message = "El factor de actividad debe ser al menos 1.0")
    @DecimalMax(value = "3.0", message = "El factor de actividad no puede superar 3.0")
    private Double activityFactor;

    @Size(max = 200000, message = "La configuración de entrenamientos no puede superar 200KB")
    private String workoutData;
}
