package com.example.app.registration;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StaffScopeResult {

    List<String> facultyIds;
    List<String> degreeProgramIds;
    /** Canonical module identifiers (catalog module codes in this codebase). */
    List<String> moduleIds;
}
