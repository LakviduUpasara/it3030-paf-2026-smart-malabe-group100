package com.example.app.service.impl;

import com.example.app.repository.SessionTokenRepository;
import com.example.app.repository.TwoFactorChallengeRepository;
import com.example.app.service.AuthSessionRevocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthSessionRevocationServiceImpl implements AuthSessionRevocationService {

    private final SessionTokenRepository sessionTokenRepository;
    private final TwoFactorChallengeRepository twoFactorChallengeRepository;

    @Override
    public void revokeAllForUser(String userId) {
        if (!StringUtils.hasText(userId)) {
            return;
        }
        String id = userId.trim();
        sessionTokenRepository.deleteByUserId(id);
        twoFactorChallengeRepository.deleteByUserId(id);
    }
}
