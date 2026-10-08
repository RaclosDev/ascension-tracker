package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutExerciseDTO {
    private String id;
    
    @NotBlank(message = "El id del ejercicio no puede estar vacio")
    private String exerciseId;
    
    private String notes;
    private String supersetId;
    private VariantDTO variant;
    @jakarta.validation.Valid
    private List<WorkoutSetDTO> sets;
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VariantDTO {
        private String grip;
        private String machine;
    }
}
