package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutDTO {
    private String id;
    
    @NotBlank(message = "El nombre del entrenamiento no puede estar vacio")
    private String name;
    
    @jakarta.validation.constraints.NotNull(message = "startedAt no puede ser nulo")
    private Long startedAt;
    private Long finishedAt;
    private String notes;
    @jakarta.validation.Valid
    @jakarta.validation.constraints.NotNull(message = "exercises no puede ser nulo")
    private List<WorkoutExerciseDTO> exercises;
}
