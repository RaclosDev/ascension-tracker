package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "workout_sets", indexes = { @Index(name = "idx_workout_set_workout_exercise_id", columnList = "workout_exercise_id") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSet implements Persistable<String> {
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

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }
}
