package com.example.app.registration.document;

import com.example.app.entity.enums.AccountStatus;
import java.time.Instant;
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

@Document(collection = "students")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    private String id;

    @Indexed(unique = true)
    private String studentId;

    private String firstName;
    private String lastName;

    @Indexed(unique = true, sparse = true)
    private String nicNumber;

    private String phone;
    private String optionalEmail;

    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    private String userAccountId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
