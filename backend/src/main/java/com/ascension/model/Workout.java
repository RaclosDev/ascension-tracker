package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "workouts", indexes = {
    @Index(name = "idx_workout_user_started", columnList = "user_email, started_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Workout implements Persistable<String> {
    @Id
    private String id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String name;

    @Column(name = "started_at")
    private Long startedAt;

    @Column(name = "finished_at")
    private Long finishedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "workout", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private Set<WorkoutExercise> exercises = new java.util.LinkedHashSet<>();

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
