package com.example.app.repository;

import com.example.app.entity.CampusMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusMessageRepository extends MongoRepository<CampusMessage, String> {
}

