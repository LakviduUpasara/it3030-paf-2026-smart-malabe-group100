package com.example.app.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBookingSummaryResponse {

    private long totalBookings;
    private long approved;
    private long pending;
    private long rejected;
}
