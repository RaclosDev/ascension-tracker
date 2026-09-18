package com.ascension.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WeekSummaryDTO {
    private LocalDate weekStart;
    private List<Double> days; // 7 elements, null for missing
    private Double average;
    private Double delta;
    private Integer entries;
}
