package com.ascension.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutTemplateDTO {
    private String id;
    private String name;
    private List<String> exerciseIds;
}
