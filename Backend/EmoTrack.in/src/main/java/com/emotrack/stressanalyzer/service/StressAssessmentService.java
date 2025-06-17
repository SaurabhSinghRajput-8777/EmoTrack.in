package com.emotrack.stressanalyzer.service;

import com.emotrack.stressanalyzer.model.StressAssessment;
import com.emotrack.stressanalyzer.repository.StressAssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StressAssessmentService {

    @Autowired
    private StressAssessmentRepository assessmentRepository;

    public StressAssessment saveStressAssessment(StressAssessment assessment) {
        // Business logic for stress assessment
        // For example, calculating stress level based on score
        int score = assessment.getTotalStressScore();
        
        if (score <= 7) {
            assessment.setStressLevel("Low");
        } else if (score <= 14) {
            assessment.setStressLevel("Moderate");
        } else {
            assessment.setStressLevel("High");
        }

        // You can add more complex logic here, like generating coping strategies
        if (assessment.getStressLevel().equals("High")) {
            assessment.setCopingStrategies(generateHighStressStrategies());
        } else if (assessment.getStressLevel().equals("Moderate")) {
            assessment.setCopingStrategies(generateModerateStressStrategies());
        } else {
            assessment.setCopingStrategies(generateLowStressStrategies());
        }

        return assessmentRepository.save(assessment);
    }

    public List<StressAssessment> getUserStressReports(Long userId) {
        return assessmentRepository.findByUserIdOrderByAssessmentDateDesc(userId);
    }

    // Methods to generate coping strategies
    private String generateHighStressStrategies() {
        return "1. Seek professional counseling\n" +
               "2. Practice intensive stress-reduction techniques\n" +
               "3. Consider medical consultation";
    }

    private String generateModerateStressStrategies() {
        return "1. Regular exercise\n" +
               "2. Meditation and mindfulness\n" +
               "3. Balanced work-life routine";
    }

    private String generateLowStressStrategies() {
        return "1. Maintain current healthy habits\n" +
               "2. Continue self-care practices\n" +
               "3. Stay socially connected";
    }
}