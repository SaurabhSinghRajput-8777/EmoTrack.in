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
    private String password;  // Keeping it simple without encryption
    private String name;
    private int age;
}
