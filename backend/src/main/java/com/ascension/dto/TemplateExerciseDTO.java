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
    private String exerciseId;
    private WorkoutExerciseDTO.VariantDTO variant;
}
