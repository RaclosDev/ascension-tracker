package com.ascension.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "steps_entries", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_email", "date"})
})
public class StepsEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer steps;
}
