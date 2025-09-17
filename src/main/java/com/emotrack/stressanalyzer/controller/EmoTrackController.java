package com.emotrack.stressanalyzer.controller;

import com.emotrack.stressanalyzer.model.User;
import com.emotrack.stressanalyzer.model.StressAssessment;
import com.emotrack.stressanalyzer.security.JwtUtil;
import com.emotrack.stressanalyzer.service.UserService;
import com.emotrack.stressanalyzer.service.StressAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow requests from any origin for development
public class EmoTrackController {

    private final UserService userService;
    private final StressAssessmentService assessmentService;
    private final JwtUtil jwtUtil;
    
    public EmoTrackController(UserService userService, 
                             StressAssessmentService assessmentService,
                             JwtUtil jwtUtil) {
        this.userService = userService;
        this.assessmentService = assessmentService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            // Don't return password in response
            registeredUser.setPassword(null);
            return ResponseEntity.ok(registeredUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginUser) {
        try {
            User authenticatedUser = userService.authenticateUser(
                loginUser.getUsername(), 
                loginUser.getPassword()
            );
            
            // Generate JWT token
            String token = jwtUtil.generateToken(authenticatedUser.getUsername(), authenticatedUser.getId());
            
            // Create response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", new User(authenticatedUser.getId(), authenticatedUser.getUsername(), 
                                        authenticatedUser.getEmail(), null, // Don't send password
                                        authenticatedUser.getName(), authenticatedUser.getAge()));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/stress-assessment")
    public ResponseEntity<?> saveStressAssessment(@RequestBody StressAssessment assessment) {
        try {
            StressAssessment savedAssessment = assessmentService.saveStressAssessment(assessment);
            return ResponseEntity.ok(savedAssessment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/stress-reports/{userId}")
    public ResponseEntity<?> getStressReports(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(assessmentService.getUserStressReports(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @GetMapping("/stress-analytics/{userId}")
    public ResponseEntity<?> getStressAnalytics(@PathVariable Long userId) {
        try {
            Map<String, Object> analytics = assessmentService.getStressAnalytics(userId);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
