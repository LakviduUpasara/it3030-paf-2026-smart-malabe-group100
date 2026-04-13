package com.example.app.repository;

import com.example.app.entity.TwoFactorChallenge;
import com.example.app.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TwoFactorChallengeRepository extends JpaRepository<TwoFactorChallenge, String> {

    void deleteByUser(UserAccount user);
}
