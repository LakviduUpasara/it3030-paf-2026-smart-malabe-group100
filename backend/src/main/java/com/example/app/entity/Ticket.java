package com.example.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String status;

    private LocalDateTime createdAt;

    /** MongoDB user id of the account that submitted the ticket (nullable for legacy rows). */
    @Column(name = "created_by_user_id", length = 64)
    private String createdByUserId;

    // ✅ getters & setters

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }

    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }

    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedByUserId() { return createdByUserId; }

    public void setCreatedByUserId(String createdByUserId) { this.createdByUserId = createdByUserId; }
}