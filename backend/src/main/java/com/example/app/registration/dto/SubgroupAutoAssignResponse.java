package com.example.app.registration.dto;

import com.example.app.registration.enums.SubgroupAllocationMode;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubgroupAutoAssignResponse {

    IntakeSummaryDto intake;
    String selectedTerm;
    boolean termMatchesCurrent;
    SubgroupAllocationMode mode;
    Integer requestedSubgroupCount;
    Integer requestedStudentsPerSubgroup;
    int totalStudents;
    int totalSubgroups;
    List<SubgroupCountDto> currentDistribution;
    List<SubgroupPreviewDto> previewDistribution;
    int changedCount;
    int unchangedCount;
    boolean applied;

    @Value
    @Builder
    public static class IntakeSummaryDto {
        String id;
        String name;
        String currentTerm;
    }

    @Value
    @Builder
    public static class SubgroupCountDto {
        String code;
        int count;
    }

    @Value
    @Builder
    public static class SubgroupPreviewDto {
        String code;
        int count;
        String firstStudentId;
        String lastStudentId;
    }
}
