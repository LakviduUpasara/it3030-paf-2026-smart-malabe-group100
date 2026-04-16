package com.example.app.registration.dto;

import com.example.app.registration.enums.SubgroupAllocationMode;
import lombok.Data;

@Data
public class SubgroupAutoAssignRequest {

    private String intakeId;
    private SubgroupAllocationMode mode;
    private Integer subgroupCount;
    private Integer studentsPerSubgroup;
    private String termCode;
    private Boolean apply;
}
