package com.example.app.registration.controller;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import com.example.app.registration.AdminRegistrationService;
import com.example.app.registration.dto.AdminCreateRequest;
import com.example.app.registration.dto.AdminCreateResponse;
import com.example.app.registration.dto.AdminUpdateRequest;
import com.example.app.registration.dto.AdminUserResponse;
import com.example.app.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admins")
@RequiredArgsConstructor
public class AdminRegistrationController {

    private final AdminRegistrationService adminRegistrationService;

    @PostMapping
    public AdminCreateResponse create(@Valid @RequestBody AdminCreateRequest request) {
        return adminRegistrationService.create(request);
    }

    @GetMapping
    public List<AdminUserResponse> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search) {
        return adminRegistrationService.list(role, status, search);
    }

    @GetMapping("/{id}")
    public AdminUserResponse getById(@PathVariable String id) {
        return adminRegistrationService.getById(id);
    }

    @PutMapping("/{id}")
    public AdminUserResponse update(@PathVariable String id, @Valid @RequestBody AdminUpdateRequest request) {
        return adminRegistrationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id, @AuthenticationPrincipal AuthenticatedUser reviewer) {
        adminRegistrationService.delete(id, reviewer);
        return ResponseEntity.noContent().build();
    }
}
