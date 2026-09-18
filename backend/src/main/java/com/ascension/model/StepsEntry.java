package com.ascension.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "steps_entries", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userEmail", "date"})
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
