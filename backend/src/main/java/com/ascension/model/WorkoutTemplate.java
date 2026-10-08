package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "workout_templates", indexes = { @Index(name = "idx_workout_template_user_email", columnList = "user_email") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutTemplate implements Persistable<String> {
    @Id
    private String id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "workout_template_exercises", joinColumns = @JoinColumn(name = "template_id"))
    private List<TemplateExercise> exercises;

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
