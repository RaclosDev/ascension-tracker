package com.ascension.service;

import com.ascension.dto.WorkoutDTO;
import com.ascension.dto.WorkoutExerciseDTO;
import com.ascension.dto.WorkoutSetDTO;
import com.ascension.model.Workout;
import com.ascension.model.WorkoutExercise;
import com.ascension.model.WorkoutSet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface WorkoutMapper {

    WorkoutMapper INSTANCE = Mappers.getMapper(WorkoutMapper.class);

    WorkoutDTO toDTO(Workout workout);

    @Mapping(target = "userEmail", ignore = true)
    @Mapping(target = "isNew", ignore = true)
    Workout toEntity(WorkoutDTO dto);

    @Mapping(target = "workout", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    @Mapping(target = "variantGrip", source = "variant.grip")
    @Mapping(target = "variantMachine", source = "variant.machine")
    @Mapping(target = "isNew", ignore = true)
    WorkoutExercise toEntity(WorkoutExerciseDTO dto);
    
    @Mapping(target = "variant.grip", source = "variantGrip")
    @Mapping(target = "variant.machine", source = "variantMachine")
    WorkoutExerciseDTO toDTO(WorkoutExercise entity);

    @Mapping(target = "workoutExercise", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    @Mapping(target = "isNew", ignore = true)
    @Mapping(target = "weight", source = "weight", qualifiedByName = "stringToBigDecimal")
    @Mapping(target = "reps", source = "reps", qualifiedByName = "stringToBigDecimal")
    WorkoutSet toEntity(WorkoutSetDTO dto);

    @Mapping(target = "weight", source = "weight", qualifiedByName = "bigDecimalToString")
    @Mapping(target = "reps", source = "reps", qualifiedByName = "bigDecimalToString")
    WorkoutSetDTO toDTO(WorkoutSet entity);

    @org.mapstruct.Named("stringToBigDecimal")
    default java.math.BigDecimal stringToBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return new java.math.BigDecimal(value.trim()).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @org.mapstruct.Named("bigDecimalToString")
    default String bigDecimalToString(java.math.BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.stripTrailingZeros().toPlainString();
    }
}
