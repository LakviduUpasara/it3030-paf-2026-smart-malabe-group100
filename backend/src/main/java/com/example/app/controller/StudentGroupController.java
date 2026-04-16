package com.example.app.controller;

import com.example.app.dto.StudentGroupRequest;
import com.example.app.dto.StudentGroupResponse;
import com.example.app.service.StudentGroupService;
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
@RequestMapping("/api/v1/student-groups")
@RequiredArgsConstructor
public class StudentGroupController {

    private final StudentGroupService studentGroupService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentGroupResponse createStudentGroup(@Valid @RequestBody StudentGroupRequest request) {
        return studentGroupService.createStudentGroup(request);
    }

    @GetMapping
    public List<StudentGroupResponse> getAllStudentGroups(
            @RequestParam(required = false) Long degreeProgramId,
            @RequestParam(required = false) Long semesterId) {
        return studentGroupService.getAllStudentGroups(degreeProgramId, semesterId);
    }

    @GetMapping("/{id}")
    public StudentGroupResponse getStudentGroupById(@PathVariable Long id) {
        return studentGroupService.getStudentGroupById(id);
    }

    @PutMapping("/{id}")
    public StudentGroupResponse updateStudentGroup(
            @PathVariable Long id,
            @Valid @RequestBody StudentGroupRequest request) {
        return studentGroupService.updateStudentGroup(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudentGroup(@PathVariable Long id) {
        studentGroupService.deleteStudentGroup(id);
    }
}
