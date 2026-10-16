package com.ascension.dto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.ConstraintViolation;

import java.util.ArrayList;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class WorkoutDTOTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testWorkoutWithTooManyExercises_FailsValidation() {
        WorkoutDTO dto = new WorkoutDTO();
        dto.setName("My Workout");
        dto.setStartedAt(System.currentTimeMillis());
        
        // 101 exercises (limit is 100)
        java.util.List<WorkoutExerciseDTO> exercises = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            exercises.add(new WorkoutExerciseDTO());
        }
        dto.setExercises(exercises);

        Set<ConstraintViolation<WorkoutDTO>> violations = validator.validate(dto);
        assertThat(violations).anyMatch(v -> v.getMessage().contains("No se permiten más de 100 ejercicios"));
    }

    @Test
    void testWorkoutExerciseWithTooManySets_FailsValidation() {
        WorkoutExerciseDTO dto = new WorkoutExerciseDTO();
        dto.setExerciseId("ex-1");
        
        // 101 sets (limit is 100)
        java.util.List<WorkoutSetDTO> sets = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            sets.add(new WorkoutSetDTO());
        }
        dto.setSets(sets);

        Set<ConstraintViolation<WorkoutExerciseDTO>> violations = validator.validate(dto);
        assertThat(violations).anyMatch(v -> v.getMessage().contains("No se permiten más de 100 series"));
    }

    @Test
    void testWorkoutSetWithValidNumericStrings_PassesValidationWithoutUnexpectedTypeException() {
        WorkoutSetDTO set = WorkoutSetDTO.builder()
                .type("normal")
                .weight("82.5")
                .reps("12")
                .distance("400")
                .build();

        Set<ConstraintViolation<WorkoutSetDTO>> violations = validator.validate(set);
        assertThat(violations).isEmpty();
    }

    @Test
    void testWorkoutSetWithInvalidNonNumericString_FailsValidation() {
        WorkoutSetDTO set = WorkoutSetDTO.builder()
                .type("normal")
                .weight("abc")
                .reps("-5")
                .build();

        Set<ConstraintViolation<WorkoutSetDTO>> violations = validator.validate(set);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getMessage().contains("El valor debe ser un numero valido"));
    }

    @Test
    void testWorkoutSetWithMultipleDecimals_PassesValidation() {
        WorkoutSetDTO set = WorkoutSetDTO.builder()
                .type("normal")
                .weight("1.134")
                .reps("10.5")
                .distance("1.60934")
                .build();

        Set<ConstraintViolation<WorkoutSetDTO>> violations = validator.validate(set);
        assertThat(violations).isEmpty();
    }

    @Test
    void testWorkoutSetWithMoreThan8IntegerDigits_FailsValidation() {
        WorkoutSetDTO set = WorkoutSetDTO.builder()
                .type("normal")
                .weight("123456789.5")
                .build();

        Set<ConstraintViolation<WorkoutSetDTO>> violations = validator.validate(set);
        assertThat(violations).anyMatch(v -> v.getMessage().contains("El valor debe ser un numero valido"));
    }
}
