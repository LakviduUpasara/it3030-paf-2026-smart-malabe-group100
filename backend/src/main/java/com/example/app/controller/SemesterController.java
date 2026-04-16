package com.example.app.controller;

import com.example.app.dto.SemesterRequest;
import com.example.app.dto.SemesterResponse;
import com.example.app.service.SemesterService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SemesterResponse createSemester(@Valid @RequestBody SemesterRequest request) {
        return semesterService.createSemester(request);
    }

    @GetMapping
    public List<SemesterResponse> getAllSemesters(@RequestParam(required = false) Long degreeProgramId) {
        return semesterService.getAllSemesters(degreeProgramId);
    }

    @GetMapping("/{id}")
    public SemesterResponse getSemesterById(@PathVariable Long id) {
        return semesterService.getSemesterById(id);
    }

    @PutMapping("/{id}")
    public SemesterResponse updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterRequest request) {
        return semesterService.updateSemester(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSemester(@PathVariable Long id) {
        semesterService.deleteSemester(id);
    }
}
