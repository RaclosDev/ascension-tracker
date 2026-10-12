package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutDTO {
    private String id;
    
    @NotBlank(message = "El nombre del entrenamiento no puede estar vacio")
    @jakarta.validation.constraints.Size(max = 255, message = "El nombre es demasiado largo")
    private String name;
    
    @jakarta.validation.constraints.NotNull(message = "startedAt no puede ser nulo")
    private Long startedAt;
    private Long finishedAt;
    
    @jakarta.validation.constraints.Size(max = 2000, message = "Las notas son demasiado largas")
    private String notes;
    @jakarta.validation.Valid
    @jakarta.validation.constraints.NotNull(message = "exercises no puede ser nulo")
    @jakarta.validation.constraints.Size(max = 100, message = "No se permiten más de 100 ejercicios por entrenamiento")
    private List<WorkoutExerciseDTO> exercises;
}
