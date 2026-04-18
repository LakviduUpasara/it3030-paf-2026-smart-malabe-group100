package com.example.app.registration.document;

import com.example.app.entity.enums.AccountStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "lab_assistants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabAssistant {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true, sparse = true)
    private String loginEmail;

    private String optionalEmail;
    private String phone;

    @Indexed(unique = true, sparse = true)
    private String nicStaffId;

    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    @Builder.Default
    private List<String> facultyIds = new ArrayList<>();

    @Builder.Default
    private List<String> degreeProgramIds = new ArrayList<>();

    @Builder.Default
    private List<String> moduleIds = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
