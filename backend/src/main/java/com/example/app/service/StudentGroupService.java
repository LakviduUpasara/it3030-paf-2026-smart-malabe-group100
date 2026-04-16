package com.example.app.service;

import com.example.app.dto.StudentGroupRequest;
import com.example.app.dto.StudentGroupResponse;
import java.util.List;

public interface StudentGroupService {

    StudentGroupResponse createStudentGroup(StudentGroupRequest request);

    List<StudentGroupResponse> getAllStudentGroups(Long degreeProgramId, Long semesterId);

    StudentGroupResponse getStudentGroupById(Long id);

    StudentGroupResponse updateStudentGroup(Long id, StudentGroupRequest request);

    void deleteStudentGroup(Long id);
}
