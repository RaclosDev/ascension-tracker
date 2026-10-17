package com.ascension.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutPreferencesDTO {
    @Size(max = 100, message = "No se pueden definir más de 100 máquinas globales")
    private List<@Size(max = 100) String> globalMachines;

    @Size(max = 100, message = "No se pueden definir más de 100 agarres globales")
    private List<@Size(max = 100) String> globalGrips;

    @Size(max = 500, message = "No se pueden definir más de 500 alias")
    private Map<String, @Size(max = 100) String> exerciseAliases;

    @Size(max = 500, message = "No se pueden definir más de 500 variantes")
    private Map<String, ExerciseVariantDTO> exerciseVariants;

    @Size(max = 100, message = "No se pueden ocultar más de 100 equipamientos")
    private List<@Size(max = 100) String> hiddenEquipments;

    @Size(max = 500, message = "No se pueden definir más de 500 GIFs personalizados")
    private Map<String, @Size(max = 500) String> exerciseGifs;

    @Size(max = 500, message = "No se pueden definir más de 500 temporizadores")
    private Map<String, @Min(1) @Max(3600) Integer> restTimers;

    @Min(value = 1, message = "El temporizador por defecto debe ser al menos 1 segundo")
    @Max(value = 3600, message = "El temporizador por defecto no puede superar 3600 segundos")
    private Integer restPreset;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExerciseVariantDTO {
        @Size(max = 50)
        private List<@Size(max = 100) String> grips;

        @Size(max = 50)
        private List<@Size(max = 100) String> machines;
    }
}
