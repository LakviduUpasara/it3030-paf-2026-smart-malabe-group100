package com.example.app.dto;

import com.example.app.entity.BookingStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private Long id;
    private Long resourceId;
    private String userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private String rejectionReason;
    private Integer expectedAttendees;

    /** Populated for admin / enriched responses */
    private String resourceName;

    private String requesterName;
    private String requesterEmail;
}
