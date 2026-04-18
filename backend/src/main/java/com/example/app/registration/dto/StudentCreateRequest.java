package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import lombok.Data;

@Data
public class StudentCreateRequest {

    private String firstName;
    private String lastName;
    private String nicNumber;
    private String phone;
    private String optionalEmail;
    private AccountStatus status;

    private String facultyId;
    private String degreeProgramId;
    private String intakeId;
    private String stream;
    private String subgroup;
    private AccountStatus enrollmentStatus;
}
