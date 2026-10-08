package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StepsEntryDTO {
    private Long id;
    
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate date;
    
    @NotNull(message = "Los pasos son obligatorios")
    @Min(value = 0, message = "Los pasos no pueden ser negativos")
    private Integer steps;
}
