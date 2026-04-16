package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LabAssistantResponse {
    String id;
    String fullName;
    String loginEmail;
    String optionalEmail;
    String phone;
    String nicStaffId;
    AccountStatus status;
    List<String> facultyIds;
    List<String> degreeProgramIds;
    List<String> moduleIds;
    EligibilityCountsDto eligibilityCounts;
}
