package com.ascension.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutPreferencesDTO {
    private List<String> globalMachines;
    private List<String> globalGrips;
    private Map<String, String> exerciseAliases;
    private Map<String, ExerciseVariantDTO> exerciseVariants;
    private List<String> hiddenEquipments;
    private Map<String, String> exerciseGifs;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseVariantDTO {
        private List<String> grips;
        private List<String> machines;
    }
}
