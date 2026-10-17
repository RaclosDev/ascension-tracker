package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateExerciseDTO {
    @jakarta.validation.constraints.NotBlank(message = "exerciseId no puede estar vacio")
    @jakarta.validation.constraints.Size(max = 255, message = "exerciseId es demasiado largo")
    private String exerciseId;

    @jakarta.validation.Valid
    private WorkoutExerciseDTO.VariantDTO variant;
}
