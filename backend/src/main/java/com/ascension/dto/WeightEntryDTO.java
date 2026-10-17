package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WeightEntryDTO {
    private Long id;
    
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate date;
    
    @NotNull(message = "El peso es obligatorio")
    @DecimalMin(value = "1.0", message = "El peso debe ser superior a 0")
    @DecimalMax(value = "1000.0", message = "El peso no puede superar 1000kg")
    private Double weight;
}
