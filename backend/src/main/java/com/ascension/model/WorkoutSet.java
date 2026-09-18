package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workout_sets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSet {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_exercise_id", nullable = false)
    private WorkoutExercise workoutExercise;

    @Column(name = "order_index")
    private Integer orderIndex;

    private String type;
    private String weight;
    private String reps;
    private String distance;
    private String duration;
    private String rpe;
    private Boolean completed;
}
