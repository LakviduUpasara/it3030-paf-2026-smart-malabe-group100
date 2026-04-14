package com.example.app.entity;

import com.example.app.entity.enums.TwoFactorMethod;
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

@Document(collection = "two_factor_challenges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorChallenge {

    @Id
    private String id;

    // Reference the owning account explicitly instead of using DBRef chains.
    @Indexed
    private String userId;

    private TwoFactorMethod method;

    private String otpCode;

    private LocalDateTime expiresAt;

    private boolean used;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime verifiedAt;
}
