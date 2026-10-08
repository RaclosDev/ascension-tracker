package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "custom_exercises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomExercise {
    @Id
    private String id;
    private String name;
    private String muscle;
    private String equipment;
    @Column(name = "user_email")
    private String userEmail;
}
