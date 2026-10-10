package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutExerciseDTO {
    private String id;
    
    @NotBlank(message = "El id del ejercicio no puede estar vacio")
    @jakarta.validation.constraints.Size(max = 255)
    private String exerciseId;
    
    @jakarta.validation.constraints.Size(max = 2000, message = "Las notas son demasiado largas")
    private String notes;
    
    @jakarta.validation.constraints.Size(max = 255)
    private String supersetId;
    private VariantDTO variant;
    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 100, message = "No se permiten más de 100 series por ejercicio")
    private List<WorkoutSetDTO> sets;
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VariantDTO {
        private String grip;
        private String machine;
    }
}
