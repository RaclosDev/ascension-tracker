package com.ascension.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateExercise {
    @Column(name = "exercise_id", nullable = false)
    private String exerciseId;

    @Column(name = "variant_grip")
    private String variantGrip;

    @Column(name = "variant_machine")
    private String variantMachine;
}
