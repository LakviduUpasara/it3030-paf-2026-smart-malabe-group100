package com.example.app.registration.controller;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.StudentRegistrationService;
import com.example.app.registration.dto.PagedStudentListResponse;
import com.example.app.registration.dto.StudentCreateRequest;
import com.example.app.registration.dto.StudentListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentRegistrationController {

    private final StudentRegistrationService studentRegistrationService;

    @PostMapping
    public StudentListItemResponse create(@RequestBody StudentCreateRequest request) {
        return studentRegistrationService.create(request);
    }

    @GetMapping
    public PagedStudentListResponse list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return studentRegistrationService.list(search, status, sort, page, pageSize);
    }

    @PutMapping("/{id}")
    public StudentListItemResponse update(@PathVariable String id, @RequestBody StudentCreateRequest request) {
        return studentRegistrationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        studentRegistrationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
