package com.example.app.controller;

import com.example.app.dto.AcademicModuleRequest;
import com.example.app.dto.AcademicModuleResponse;
import com.example.app.service.AcademicModuleService;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/academic-modules")
@RequiredArgsConstructor
public class AcademicModuleController {

    private final AcademicModuleService academicModuleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AcademicModuleResponse createAcademicModule(@Valid @RequestBody AcademicModuleRequest request) {
        return academicModuleService.createAcademicModule(request);
    }

    @GetMapping
    public List<AcademicModuleResponse> getAllAcademicModules() {
        return academicModuleService.getAllAcademicModules();
    }

    @GetMapping("/{id}")
    public AcademicModuleResponse getAcademicModuleById(@PathVariable Long id) {
        return academicModuleService.getAcademicModuleById(id);
    }

    @PutMapping("/{id}")
    public AcademicModuleResponse updateAcademicModule(
            @PathVariable Long id,
            @Valid @RequestBody AcademicModuleRequest request) {
        return academicModuleService.updateAcademicModule(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAcademicModule(@PathVariable Long id) {
        academicModuleService.deleteAcademicModule(id);
    }
}
