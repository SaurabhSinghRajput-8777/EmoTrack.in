package com.emotrack.stressanalyzer.service;

import com.emotrack.stressanalyzer.model.User;
import com.emotrack.stressanalyzer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("Username already exists");
        }
        
        // Additional validation can be added here
        return userRepository.save(user);
    }

    public User authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        if (!user.getPassword().equals(password)) {
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