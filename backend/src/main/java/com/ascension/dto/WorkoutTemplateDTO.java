package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutTemplateDTO {
    private String id;
    
    @NotBlank(message = "El nombre de la plantilla es obligatorio")
    private String name;
    
    @NotNull(message = "La lista de ejercicios no puede ser nula")
    private List<TemplateExerciseDTO> exercises;
}
