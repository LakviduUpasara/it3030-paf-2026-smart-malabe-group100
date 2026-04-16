package com.example.app.registration.controller;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import com.example.app.registration.AdminRegistrationService;
import com.example.app.registration.dto.AdminCreateRequest;
import com.example.app.registration.dto.AdminCreateResponse;
import com.example.app.registration.dto.AdminUserResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    public AdminCreateResponse create(@RequestBody AdminCreateRequest request) {
        return adminRegistrationService.create(request);
    }

    @GetMapping
    public List<AdminUserResponse> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search) {
        return adminRegistrationService.list(role, status, search);
    }
}
