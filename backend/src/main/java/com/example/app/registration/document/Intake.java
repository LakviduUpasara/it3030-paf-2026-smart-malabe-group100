package com.example.app.registration.document;

import com.example.app.registration.enums.IntakeBatchStatus;
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
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection = "intakes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "faculty_degree_year_month", def = "{'facultyCode': 1, 'degreeCode': 1, 'intakeYear': 1, 'intakeMonth': 1, 'deleted': 1}")
public class Intake {

    @Id
    private String id;

    /** Display name, e.g. "2026 June". */
    private String name;

    /** Legacy alias; prefer {@link #name}. */
    private String label;

    @Indexed
    private String facultyCode;

    @Indexed
    private String degreeCode;

    private Integer intakeYear;

    /** Canonical English month: January … December */
    private String intakeMonth;

    /** Optional cohort stream label (JSON name {@code stream}). */
    @JsonProperty("stream")
    private String cohortStream;

    @Builder.Default
    private IntakeBatchStatus status = IntakeBatchStatus.ACTIVE;

    @Builder.Default
    private String currentTerm = "Y1S1";

    @Builder.Default
    private Boolean autoJumpEnabled = true;

    @Builder.Default
    private Boolean lockPastTerms = false;

    @Builder.Default
    private Integer defaultWeeksPerTerm = 16;

    @Builder.Default
    private Integer defaultNotifyBeforeDays = 3;

    @Builder.Default
    private Boolean autoGenerateFutureTerms = true;

    @Builder.Default
    private List<TermScheduleRow> termSchedules = new ArrayList<>();

    @Builder.Default
    private List<IntakeNotificationEntry> notifications = new ArrayList<>();

    @Builder.Default
    private boolean deleted = false;

    /** Prefix for generated student IDs, e.g. IT2604 — optional override. */
    private String studentIdPrefix;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /** Resolve display name for APIs (prefers {@link #name}, falls back to {@link #label}). */
    public String resolveDisplayName() {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return label != null ? label.trim() : "";
    }
}
