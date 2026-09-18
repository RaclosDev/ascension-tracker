package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_exercises")
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

    @Column(name = "superset_id")
    private String supersetId;

    @Column(name = "order_index")
    private Integer orderIndex;

    @OneToMany(mappedBy = "workoutExercise", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @org.hibernate.annotations.BatchSize(size = 50)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<WorkoutSet> sets = new ArrayList<>();
}
