package com.example.app.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "session_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionToken {

    @Id
    private String token;

    // Keep the session document small by storing only the owning user id.
    @Indexed
    private String userId;

    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;

    /** When null, legacy tokens are treated as {@link SessionPhase#FULL}. */
    private SessionPhase phase;
}
