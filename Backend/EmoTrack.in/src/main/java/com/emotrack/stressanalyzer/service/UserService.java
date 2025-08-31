package com.emotrack.stressanalyzer.service;

import com.emotrack.stressanalyzer.model.User;
import com.emotrack.stressanalyzer.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("Username already exists");
        }
        
        // Encrypt password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        return userRepository.save(user);
    }

    public User authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        // Use password encoder to verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        return user;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // New method to get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // New method to delete a user by ID
    public void deleteUser(Long userId) {
        // Check if user exists before attempting to delete
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        
        userRepository.deleteById(userId);
    }
}