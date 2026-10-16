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
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d{1,2})?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos y 2 decimales")
    private String weight;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d{1,2})?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos y 2 decimales")
    private String reps;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @Pattern(regexp = "^(\\d{1,8}(\\.\\d{1,2})?|)$", message = "El valor debe ser un numero valido de hasta 8 digitos y 2 decimales")
    private String distance;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    private String duration;
    @Size(max = 20, message = "El valor es demasiado largo")
    private String rpe;
    private Boolean completed;
}
