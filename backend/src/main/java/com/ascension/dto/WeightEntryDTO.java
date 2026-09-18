package com.ascension.dto;

import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WeightEntryDTO {
    private Long id;
    private LocalDate date;
    private Double weight;
}
