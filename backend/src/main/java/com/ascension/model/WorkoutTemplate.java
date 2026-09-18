package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "workout_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutTemplate {
    @Id
    private String id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String name;

    @ElementCollection
    @CollectionTable(name = "workout_template_exercises", joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "exercise_id")
    private List<String> exerciseIds;
}
