package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "custom_exercises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomExercise implements Persistable<String> {
    @Id
    private String id;
    private String name;
    private String muscle;
    private String equipment;
    @Column(name = "user_email")
    private String userEmail;

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
