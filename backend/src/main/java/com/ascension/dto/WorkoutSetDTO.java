package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSetDTO {
    private String id;
    
    @NotNull(message = "El tipo de set es obligatorio")
    private String type;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d+)?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos")
    private String weight;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d+)?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos")
    private String reps;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d+)?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos")
    private String distance;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    private String duration;
    @Size(max = 20, message = "El valor es demasiado largo")
    private String rpe;
    @Size(max = 20)
    @Pattern(regexp = "^([0-9](\\.[05])?|10(\\.0)?)?$", message = "El RIR debe estar entre 0 y 10")
    private String rir;
    @Size(max = 200)
    private String skipReason;
    private Boolean completed;
}
