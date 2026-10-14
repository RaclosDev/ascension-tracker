package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSetDTO {
    private String id;
    
    @NotNull(message = "El tipo de set es obligatorio")
    private String type;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @PositiveOrZero(message = "El peso debe ser 0 o positivo")
    private String weight;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @PositiveOrZero(message = "Las repeticiones deben ser 0 o positivas")
    private String reps;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    @PositiveOrZero(message = "La distancia debe ser 0 o positiva")
    private String distance;
    
    @Size(max = 20, message = "El valor es demasiado largo")
    private String duration;
    @Size(max = 20, message = "El valor es demasiado largo")
    private String rpe;
    private Boolean completed;
}
