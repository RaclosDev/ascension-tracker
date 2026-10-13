package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutImportRequestDTO {

    private List<@Valid CustomExerciseDTO> customExercises;

    @NotNull(message = "La lista de entrenamientos a importar no puede ser nula")
    @Size(max = 1000, message = "No se pueden importar más de 1000 entrenamientos por lote")
    private List<@Valid WorkoutDTO> workouts;
}
