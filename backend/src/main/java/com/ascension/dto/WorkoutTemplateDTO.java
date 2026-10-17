package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutTemplateDTO {
    private String id;
    
    @NotBlank(message = "El nombre de la plantilla es obligatorio")
    @jakarta.validation.constraints.Size(max = 255, message = "El nombre de la plantilla es demasiado largo")
    private String name;
    
    @NotNull(message = "La lista de ejercicios no puede ser nula")
    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 100, message = "No se permiten más de 100 ejercicios por plantilla")
    private List<@jakarta.validation.Valid TemplateExerciseDTO> exercises;
}
