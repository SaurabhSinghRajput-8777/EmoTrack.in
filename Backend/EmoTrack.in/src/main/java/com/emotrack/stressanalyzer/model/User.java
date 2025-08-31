package com.emotrack.stressanalyzer.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@SuppressWarnings("unused")
@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;
    private String email;
    private String password;  // Now encrypted with BCrypt
    private String name;
    private int age;
    
    // Default constructor
    public User() {}
    
    // Constructor for creating user responses (without sensitive data)
    public User(Long id, String username, String email, String password, String name, int age) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.name = name;
        this.age = age;
    }
}
