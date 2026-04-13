package com.example.app.repository;

import com.example.app.entity.SessionToken;
import com.example.app.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionTokenRepository extends JpaRepository<SessionToken, String> {

    void deleteByUser(UserAccount user);
}
