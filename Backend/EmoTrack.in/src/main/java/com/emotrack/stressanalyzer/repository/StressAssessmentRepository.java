package com.emotrack.stressanalyzer.repository;

import com.emotrack.stressanalyzer.model.StressAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StressAssessmentRepository extends JpaRepository<StressAssessment, Long> {
    List<StressAssessment> findByUserIdOrderByAssessmentDateDesc(Long userId);
}