package com.example.app.controller;

import com.example.app.dto.AcademicSessionRequest;
import com.example.app.dto.AcademicSessionResponse;
import com.example.app.service.AcademicSessionService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/academic-sessions")
@RequiredArgsConstructor
public class AcademicSessionController {

    private final AcademicSessionService academicSessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AcademicSessionResponse createAcademicSession(@Valid @RequestBody AcademicSessionRequest request) {
        return academicSessionService.createAcademicSession(request);
    }

    @GetMapping
    public List<AcademicSessionResponse> getAllAcademicSessions(
            @RequestParam(required = false) Long moduleOfferingId,
            @RequestParam(required = false) Long studentGroupId,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) LocalDate sessionDate) {
        return academicSessionService.getAllAcademicSessions(
                moduleOfferingId,
                studentGroupId,
                resourceId,
                sessionDate);
    }

    @GetMapping("/{id}")
    public AcademicSessionResponse getAcademicSessionById(@PathVariable Long id) {
        return academicSessionService.getAcademicSessionById(id);
    }

    @PutMapping("/{id}")
    public AcademicSessionResponse updateAcademicSession(
            @PathVariable Long id,
            @Valid @RequestBody AcademicSessionRequest request) {
        return academicSessionService.updateAcademicSession(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAcademicSession(@PathVariable Long id) {
        academicSessionService.deleteAcademicSession(id);
    }
}
