package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_exercises", indexes = { @Index(name = "idx_workout_exercise_workout_id", columnList = "workout_id") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutExercise {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    private Workout workout;

    @Column(name = "exercise_id")
    private String exerciseId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "variant_grip")
    private String variantGrip;

    @Column(name = "variant_machine")
    private String variantMachine;

    @Column(name = "superset_id")
    private String supersetId;

    @Column(name = "order_index")
    private Integer orderIndex;

    @OneToMany(mappedBy = "workoutExercise", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<WorkoutSet> sets = new ArrayList<>();
}
