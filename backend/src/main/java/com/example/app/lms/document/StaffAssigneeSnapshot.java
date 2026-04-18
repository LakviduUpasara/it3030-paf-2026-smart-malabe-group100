package com.example.app.lms.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAssigneeSnapshot {

    private String id;

    private String fullName;

    private String loginEmail;
}
