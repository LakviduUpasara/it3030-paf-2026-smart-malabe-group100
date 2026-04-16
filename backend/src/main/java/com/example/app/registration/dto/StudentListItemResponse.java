package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentListItemResponse {
    String id;
    String studentId;
    String firstName;
    String lastName;
    String email;
    String optionalEmail;
    String nicNumber;
    AccountStatus status;
    int enrollmentCount;
    LatestEnrollmentDto latestEnrollment;
}
