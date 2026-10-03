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
    Workout toEntity(WorkoutDTO dto);

    @Mapping(target = "workout", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    @Mapping(target = "variantGrip", source = "variant.grip")
    @Mapping(target = "variantMachine", source = "variant.machine")
    WorkoutExercise toEntity(WorkoutExerciseDTO dto);
    
    @Mapping(target = "variant.grip", source = "variantGrip")
    @Mapping(target = "variant.machine", source = "variantMachine")
    WorkoutExerciseDTO toDTO(WorkoutExercise entity);

    @Mapping(target = "workoutExercise", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    WorkoutSet toEntity(WorkoutSetDTO dto);

    WorkoutSetDTO toDTO(WorkoutSet entity);
}
