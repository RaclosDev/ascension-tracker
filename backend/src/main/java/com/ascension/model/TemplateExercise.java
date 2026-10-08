package com.ascension.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@Setter
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
