// StressAssessment.java
package com.emotrack.stressanalyzer.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stress_assessments")
public class StressAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private int totalStressScore;
    private String stressLevel;
    private LocalDateTime assessmentDate = LocalDateTime.now();
    private String copingStrategies;
}