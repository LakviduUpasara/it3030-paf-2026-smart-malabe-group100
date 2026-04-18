package com.example.app.service;

import com.example.app.dto.settings.PlatformSecuritySettingsResponse;
import com.example.app.dto.settings.PlatformSecuritySettingsUpdateRequest;
import com.example.app.entity.PlatformSecuritySettings;
import com.example.app.security.AuthenticatedUser;

public interface PlatformSecurityService {

    PlatformSecuritySettings getOrCreateDefault();

    PlatformSecuritySettingsResponse getPublicDto();

    PlatformSecuritySettingsResponse update(AuthenticatedUser admin, PlatformSecuritySettingsUpdateRequest request);
}
