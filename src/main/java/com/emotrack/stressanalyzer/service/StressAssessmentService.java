package com.emotrack.stressanalyzer.service;

import com.emotrack.stressanalyzer.model.StressAssessment;
import com.emotrack.stressanalyzer.repository.StressAssessmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StressAssessmentService {

    private final StressAssessmentRepository assessmentRepository;
    
    public StressAssessmentService(StressAssessmentRepository assessmentRepository) {
        this.assessmentRepository = assessmentRepository;
    }

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
    
    public Map<String, Object> getStressAnalytics(Long userId) {
        List<StressAssessment> assessments = getUserStressReports(userId);
        Map<String, Object> analytics = new HashMap<>();
        
        if (assessments.isEmpty()) {
            analytics.put("message", "No assessments found");
            return analytics;
        }
        
        // Basic statistics
        analytics.put("totalAssessments", assessments.size());
        
        // Average stress score
        double averageScore = assessments.stream()
                .mapToInt(StressAssessment::getTotalStressScore)
                .average()
                .orElse(0.0);
        analytics.put("averageStressScore", Math.round(averageScore * 100.0) / 100.0);
        
        // Stress level distribution
        Map<String, Long> stressLevelCount = assessments.stream()
                .collect(Collectors.groupingBy(StressAssessment::getStressLevel, Collectors.counting()));
        analytics.put("stressLevelDistribution", stressLevelCount);
        
        // Recent trend (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minus(30, ChronoUnit.DAYS);
        List<StressAssessment> recentAssessments = assessments.stream()
                .filter(a -> a.getAssessmentDate().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());
        
        // Weekly trend data for charts
        Map<String, Object> weeklyTrend = getWeeklyTrend(recentAssessments);
        analytics.put("weeklyTrend", weeklyTrend);
        
        // Monthly comparison
        Map<String, Object> monthlyComparison = getMonthlyComparison(assessments);
        analytics.put("monthlyComparison", monthlyComparison);
        
        // Stress pattern insights
        analytics.put("insights", generateInsights(assessments, averageScore));
        
        // Latest assessment
        analytics.put("latestAssessment", assessments.get(0));
        
        return analytics;
    }
    
    private Map<String, Object> getWeeklyTrend(List<StressAssessment> assessments) {
        Map<String, Object> weeklyData = new HashMap<>();
        
        // Group by week and calculate average
        Map<String, List<StressAssessment>> weeklyGroups = assessments.stream()
                .collect(Collectors.groupingBy(a -> 
                    "Week " + a.getAssessmentDate().getDayOfYear() / 7));
        
        List<String> labels = new ArrayList<>();
        List<Double> scores = new ArrayList<>();
        List<String> levels = new ArrayList<>();
        
        weeklyGroups.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    labels.add(entry.getKey());
                    double avgScore = entry.getValue().stream()
                            .mapToInt(StressAssessment::getTotalStressScore)
                            .average().orElse(0.0);
                    scores.add(Math.round(avgScore * 100.0) / 100.0);
                    
                    // Determine predominant stress level for the week
                    String predominantLevel = entry.getValue().stream()
                            .collect(Collectors.groupingBy(StressAssessment::getStressLevel, Collectors.counting()))
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("Unknown");
                    levels.add(predominantLevel);
                });
        
        weeklyData.put("labels", labels);
        weeklyData.put("scores", scores);
        weeklyData.put("levels", levels);
        
        return weeklyData;
    }
    
    private Map<String, Object> getMonthlyComparison(List<StressAssessment> assessments) {
        Map<String, Object> monthlyData = new HashMap<>();
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonth = now.minus(1, ChronoUnit.MONTHS);
        LocalDateTime twoMonthsAgo = now.minus(2, ChronoUnit.MONTHS);
        
        List<StressAssessment> currentMonth = assessments.stream()
                .filter(a -> a.getAssessmentDate().isAfter(lastMonth))
                .collect(Collectors.toList());
        
        List<StressAssessment> previousMonth = assessments.stream()
                .filter(a -> a.getAssessmentDate().isAfter(twoMonthsAgo) && a.getAssessmentDate().isBefore(lastMonth))
                .collect(Collectors.toList());
        
        double currentAvg = currentMonth.stream()
                .mapToInt(StressAssessment::getTotalStressScore)
                .average().orElse(0.0);
        
        double previousAvg = previousMonth.stream()
                .mapToInt(StressAssessment::getTotalStressScore)
                .average().orElse(0.0);
        
        monthlyData.put("currentMonthAverage", Math.round(currentAvg * 100.0) / 100.0);
        monthlyData.put("previousMonthAverage", Math.round(previousAvg * 100.0) / 100.0);
        monthlyData.put("improvement", Math.round((previousAvg - currentAvg) * 100.0) / 100.0);
        monthlyData.put("improvementPercentage", 
                previousAvg > 0 ? Math.round(((previousAvg - currentAvg) / previousAvg) * 10000.0) / 100.0 : 0.0);
        
        return monthlyData;
    }
    
    private List<String> generateInsights(List<StressAssessment> assessments, double averageScore) {
        List<String> insights = new ArrayList<>();
        
        // Trend analysis
        if (assessments.size() >= 2) {
            StressAssessment latest = assessments.get(0);
            StressAssessment previous = assessments.get(1);
            
            if (latest.getTotalStressScore() < previous.getTotalStressScore()) {
                insights.add("Your stress levels are improving! Keep up the good work.");
            } else if (latest.getTotalStressScore() > previous.getTotalStressScore()) {
                insights.add("Your stress levels have increased recently. Consider implementing stress reduction techniques.");
            } else {
                insights.add("Your stress levels are stable.");
            }
        }
        
        // Overall stress level insights
        if (averageScore <= 7) {
            insights.add("Your average stress level is low. You're managing stress well!");
        } else if (averageScore <= 14) {
            insights.add("Your average stress level is moderate. Regular stress management practices could be beneficial.");
        } else {
            insights.add("Your average stress level is high. Consider seeking professional support and implementing stress reduction strategies.");
        }
        
        // Frequency insights
        if (assessments.size() >= 5) {
            insights.add("Great job on consistently tracking your stress levels!");
        } else {
            insights.add("Regular assessment helps in better stress management. Try to check in weekly.");
        }
        
        return insights;
    }
}
