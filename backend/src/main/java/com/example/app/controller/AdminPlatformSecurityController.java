package com.example.app.controller;

import com.example.app.dto.settings.PlatformSecuritySettingsResponse;
import com.example.app.dto.settings.PlatformSecuritySettingsUpdateRequest;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.PlatformSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/platform-settings")
@RequiredArgsConstructor
public class AdminPlatformSecurityController {

    private final PlatformSecurityService platformSecurityService;

    @GetMapping
    public ResponseEntity<PlatformSecuritySettingsResponse> get(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to load platform security settings.");
        }
        return ResponseEntity.ok(platformSecurityService.getPublicDto());
    }

    @PutMapping
    public ResponseEntity<PlatformSecuritySettingsResponse> put(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody PlatformSecuritySettingsUpdateRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to update platform security settings.");
        }
        return ResponseEntity.ok(platformSecurityService.update(user, request));
    }
}
