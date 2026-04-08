package com.example.app.entity;

import java.time.LocalDateTime;

@Entity
public class Ticket {
    @Id
    @GeneratedValue
    private Long id;

    private String title;
    private String description;
    private String status; // OPEN, IN_PROGRESS, CLOSED
    private LocalDateTime createdAt;
}
