package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import java.util.List;
import lombok.Data;

@Data
public class LabAssistantCreateRequest {

    private String fullName;
    private String optionalEmail;
    private String phone;
    private String nicStaffId;
    private AccountStatus status;
    private List<String> facultyIds;
    private List<String> degreeProgramIds;
    private List<String> moduleIds;
}
