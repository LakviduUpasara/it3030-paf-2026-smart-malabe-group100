package com.example.app.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    private String id;

    @Indexed
    private String resourceId;

    @Indexed
    private String userId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private BookingStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
