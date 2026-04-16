package com.example.app.controller;

import com.example.app.dto.DegreeProgramRequest;
import com.example.app.dto.DegreeProgramResponse;
import com.example.app.service.DegreeProgramService;
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
@RequestMapping("/api/v1/programs")
@RequiredArgsConstructor
public class DegreeProgramController {

    private final DegreeProgramService degreeProgramService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DegreeProgramResponse createDegreeProgram(@Valid @RequestBody DegreeProgramRequest request) {
        return degreeProgramService.createDegreeProgram(request);
    }

    @GetMapping
    public List<DegreeProgramResponse> getAllDegreePrograms() {
        return degreeProgramService.getAllDegreePrograms();
    }

    @GetMapping("/{id}")
    public DegreeProgramResponse getDegreeProgramById(@PathVariable Long id) {
        return degreeProgramService.getDegreeProgramById(id);
    }

    @PutMapping("/{id}")
    public DegreeProgramResponse updateDegreeProgram(
            @PathVariable Long id,
            @Valid @RequestBody DegreeProgramRequest request) {
        return degreeProgramService.updateDegreeProgram(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDegreeProgram(@PathVariable Long id) {
        degreeProgramService.deleteDegreeProgram(id);
    }
}
