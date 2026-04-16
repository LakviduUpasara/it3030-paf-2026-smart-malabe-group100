package com.example.app.repository;

import com.example.app.entity.SessionToken;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SessionTokenRepository extends MongoRepository<SessionToken, String> {

    void deleteByUserId(String userId);
}
