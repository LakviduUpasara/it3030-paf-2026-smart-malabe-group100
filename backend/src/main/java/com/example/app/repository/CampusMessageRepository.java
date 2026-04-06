package com.example.app.repository;

import com.example.app.entity.CampusMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampusMessageRepository extends JpaRepository<CampusMessage, Long> {
}

