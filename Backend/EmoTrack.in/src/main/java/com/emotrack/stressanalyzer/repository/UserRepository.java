package com.emotrack.stressanalyzer.repository;

import com.emotrack.stressanalyzer.model.User;
import com.emotrack.stressanalyzer.model.StressAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@SuppressWarnings("unused")
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}