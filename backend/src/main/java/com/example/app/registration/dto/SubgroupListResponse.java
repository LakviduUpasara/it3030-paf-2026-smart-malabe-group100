package com.example.app.registration.dto;

import com.example.app.registration.enums.StudentStream;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubgroupListResponse {
    String intakeId;
    String facultyId;
    String degreeProgramId;
    StudentStream stream;
    long total;
    List<SubgroupItemDto> items;
}
