package com.example.app.service.impl;

import com.example.app.dto.settings.PlatformSecuritySettingsResponse;
import com.example.app.dto.settings.PlatformSecuritySettingsUpdateRequest;
import com.example.app.entity.PlatformSecuritySettings;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.repository.PlatformSecuritySettingsRepository;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.PlatformSecurityService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlatformSecurityServiceImpl implements PlatformSecurityService {

    private final PlatformSecuritySettingsRepository repository;

    @Override
    public PlatformSecuritySettings getOrCreateDefault() {
        return repository.findById(PlatformSecuritySettings.SINGLETON_ID).orElseGet(() -> repository.save(defaultDocument()));
    }

    @Override
    public PlatformSecuritySettingsResponse getPublicDto() {
        return toDto(getOrCreateDefault());
    }

    @Override
    public PlatformSecuritySettingsResponse update(AuthenticatedUser admin, PlatformSecuritySettingsUpdateRequest request) {
        if (admin == null || admin.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only a platform administrator can change security policy.");
        }
        PlatformSecuritySettings s = getOrCreateDefault();
        if (request.getForceTwoFactorForAllUsers() != null) {
            s.setForceTwoFactorForAllUsers(request.getForceTwoFactorForAllUsers());
        }
        if (request.getTreatLegacyUnknownTwoFactorAsOptional() != null) {
            s.setTreatLegacyUnknownTwoFactorAsOptional(request.getTreatLegacyUnknownTwoFactorAsOptional());
        }
        if (request.getRequirePasswordChangeOnFirstLoginForLocalUsers() != null) {
            s.setRequirePasswordChangeOnFirstLoginForLocalUsers(request.getRequirePasswordChangeOnFirstLoginForLocalUsers());
        }
        if (request.getNewUsersMustEnableTwoFactor() != null) {
            s.setNewUsersMustEnableTwoFactor(request.getNewUsersMustEnableTwoFactor());
        }
        if (request.getAllowSkippingFirstLoginTwoFactorSetup() != null) {
            s.setAllowSkippingFirstLoginTwoFactorSetup(request.getAllowSkippingFirstLoginTwoFactorSetup());
        }
        if (s.isNewUsersMustEnableTwoFactor() && s.isAllowSkippingFirstLoginTwoFactorSetup()) {
            s.setAllowSkippingFirstLoginTwoFactorSetup(false);
        }
        s.setUpdatedAt(LocalDateTime.now());
        s.setLastUpdatedByEmail(admin.getEmail());
        repository.save(s);
        return toDto(s);
    }

    private static PlatformSecuritySettings defaultDocument() {
        return PlatformSecuritySettings.builder()
                .id(PlatformSecuritySettings.SINGLETON_ID)
                .forceTwoFactorForAllUsers(false)
                .treatLegacyUnknownTwoFactorAsOptional(true)
                .requirePasswordChangeOnFirstLoginForLocalUsers(true)
                .newUsersMustEnableTwoFactor(false)
                .allowSkippingFirstLoginTwoFactorSetup(true)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private static PlatformSecuritySettingsResponse toDto(PlatformSecuritySettings s) {
        return PlatformSecuritySettingsResponse.builder()
                .forceTwoFactorForAllUsers(s.isForceTwoFactorForAllUsers())
                .treatLegacyUnknownTwoFactorAsOptional(s.isTreatLegacyUnknownTwoFactorAsOptional())
                .requirePasswordChangeOnFirstLoginForLocalUsers(s.isRequirePasswordChangeOnFirstLoginForLocalUsers())
                .newUsersMustEnableTwoFactor(s.isNewUsersMustEnableTwoFactor())
                .allowSkippingFirstLoginTwoFactorSetup(s.isAllowSkippingFirstLoginTwoFactorSetup())
                .updatedAt(s.getUpdatedAt())
                .lastUpdatedByEmail(s.getLastUpdatedByEmail())
                .build();
    }
}
