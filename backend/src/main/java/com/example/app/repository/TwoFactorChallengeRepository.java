package com.example.app.repository;

import com.example.app.entity.TwoFactorChallenge;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TwoFactorChallengeRepository extends MongoRepository<TwoFactorChallenge, String> {

    void deleteByUserId(String userId);
}
