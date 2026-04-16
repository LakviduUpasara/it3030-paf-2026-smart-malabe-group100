package com.example.app.registration.controller;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.LecturerRegistrationService;
import com.example.app.registration.dto.LecturerCreateRequest;
import com.example.app.registration.dto.LecturerResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lecturers")
@RequiredArgsConstructor
public class LecturerRegistrationController {

    private final LecturerRegistrationService lecturerRegistrationService;

    @PostMapping
    public LecturerResponse create(@RequestBody LecturerCreateRequest request) {
        return lecturerRegistrationService.create(request);
    }

    @GetMapping
    public List<LecturerResponse> list(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search) {
        return lecturerRegistrationService.list(status, search);
    }
}
