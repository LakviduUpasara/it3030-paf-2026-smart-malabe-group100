package com.example.app.registration.controller;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.LabAssistantRegistrationService;
import com.example.app.registration.dto.LabAssistantCreateRequest;
import com.example.app.registration.dto.LabAssistantResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lab-assistants")
@RequiredArgsConstructor
public class LabAssistantRegistrationController {

    private final LabAssistantRegistrationService labAssistantRegistrationService;

    @PostMapping
    public LabAssistantResponse create(@RequestBody LabAssistantCreateRequest request) {
        return labAssistantRegistrationService.create(request);
    }

    @GetMapping
    public List<LabAssistantResponse> list(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search) {
        return labAssistantRegistrationService.list(status, search);
    }
}
