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
@CrossOrigin(origins = "*") // Add explicit CORS annotation
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

    // Add health check endpoint
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "EmoTrack API is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    // Add database connection test endpoint
    @GetMapping("/test-db")
    public ResponseEntity<?> testDatabase() {
        try {
            long userCount = userService.getAllUsers().size();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Database connected");
            response.put("userCount", userCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "Database connection failed");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            System.out.println("Signup request received for user: " + user.getUsername());
            User registeredUser = userService.registerUser(user);
            // Don't return password in response
            registeredUser.setPassword(null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "User registered successfully");
            response.put("user", registeredUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Signup error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Unexpected signup error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginUser) {
        try {
            System.out.println("Login request received for user: " + loginUser.getUsername());
            User authenticatedUser = userService.authenticateUser(
                loginUser.getUsername(), 
                loginUser.getPassword()
            );
            
            // Generate JWT token
            String token = jwtUtil.generateToken(authenticatedUser.getUsername(), authenticatedUser.getId());
            
            // Create response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("token", token);
            response.put("user", new User(authenticatedUser.getId(), authenticatedUser.getUsername(), 
                                        authenticatedUser.getEmail(), null, // Don't send password
                                        authenticatedUser.getName(), authenticatedUser.getAge()));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Login error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Unexpected login error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/stress-assessment")
    public ResponseEntity<?> saveStressAssessment(@RequestBody StressAssessment assessment) {
        try {
            StressAssessment savedAssessment = assessmentService.saveStressAssessment(assessment);
            return ResponseEntity.ok(savedAssessment);
        } catch (Exception e) {
            System.err.println("Stress assessment save error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/stress-reports/{userId}")
    public ResponseEntity<?> getStressReports(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(assessmentService.getUserStressReports(userId));
        } catch (Exception e) {
            System.err.println("Stress reports fetch error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (Exception e) {
            System.err.println("Users fetch error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (RuntimeException e) {
            System.err.println("User deletion error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @GetMapping("/stress-analytics/{userId}")
    public ResponseEntity<?> getStressAnalytics(@PathVariable Long userId) {
        try {
            Map<String, Object> analytics = assessmentService.getStressAnalytics(userId);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            System.err.println("Stress analytics error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}