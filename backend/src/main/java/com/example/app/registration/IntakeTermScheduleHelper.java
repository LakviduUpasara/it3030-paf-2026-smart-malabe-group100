package com.example.app.registration;

import com.example.app.registration.document.TermScheduleRow;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class IntakeTermScheduleHelper {

    private IntakeTermScheduleHelper() {}

    public static List<TermScheduleRow> emptyTermSchedule(int defaultWeeks, int defaultNotify) {
        List<TermScheduleRow> rows = new ArrayList<>();
        for (String code : IntakeConstants.TERM_SEQUENCE) {
            rows.add(
                    TermScheduleRow.builder()
                            .termCode(code)
                            .weeks(defaultWeeks)
                            .notifyBeforeDays(clampNotify(defaultNotify))
                            .isManuallyCustomized(false)
                            .build());
        }
        return rows;
    }

    public static List<TermScheduleRow> sanitizeTermSchedules(
            List<TermScheduleRow> input, int defaultWeeks, int defaultNotify) {
        Map<String, TermScheduleRow> byCode = new HashMap<>();
        if (input != null) {
            for (TermScheduleRow row : input) {
                if (row == null || row.getTermCode() == null) {
                    continue;
                }
                String code = row.getTermCode().trim().toUpperCase(Locale.ROOT);
                if (!IntakeConstants.TERM_SEQUENCE.contains(code)) {
                    continue;
                }
                int weeks = row.getWeeks() != null ? row.getWeeks() : defaultWeeks;
                weeks = Math.min(52, Math.max(1, weeks));
                int notify = row.getNotifyBeforeDays() != null ? row.getNotifyBeforeDays() : defaultNotify;
                TermScheduleRow merged =
                        TermScheduleRow.builder()
                                .termCode(code)
                                .startDate(row.getStartDate())
                                .endDate(row.getEndDate())
                                .weeks(weeks)
                                .notifyBeforeDays(clampNotify(notify))
                                .isManuallyCustomized(Boolean.TRUE.equals(row.getIsManuallyCustomized()))
                                .notificationSentAt(row.getNotificationSentAt())
                                .build();
                byCode.put(code, merged);
            }
        }

        List<TermScheduleRow> out = new ArrayList<>();
        for (String code : IntakeConstants.TERM_SEQUENCE) {
            TermScheduleRow row = byCode.get(code);
            if (row == null) {
                row =
                        TermScheduleRow.builder()
                                .termCode(code)
                                .weeks(defaultWeeks)
                                .notifyBeforeDays(clampNotify(defaultNotify))
                                .isManuallyCustomized(false)
                                .build();
            }
            LocalDate start = row.getStartDate();
            LocalDate end = row.getEndDate();
            int w = row.getWeeks() != null ? row.getWeeks() : defaultWeeks;
            if (start != null && end == null) {
                end = start.plusWeeks(w);
            } else if (start != null && end != null && end.isBefore(start)) {
                end = start.plusWeeks(w);
            }
            out.add(
                    TermScheduleRow.builder()
                            .termCode(code)
                            .startDate(start)
                            .endDate(end)
                            .weeks(w)
                            .notifyBeforeDays(clampNotify(row.getNotifyBeforeDays() != null ? row.getNotifyBeforeDays() : defaultNotify))
                            .isManuallyCustomized(row.getIsManuallyCustomized())
                            .notificationSentAt(row.getNotificationSentAt())
                            .build());
        }
        return out;
    }

    public static boolean hasInvalidTermScheduleRange(List<TermScheduleRow> rows) {
        if (rows == null) {
            return false;
        }
        for (TermScheduleRow row : rows) {
            if (row.getStartDate() != null
                    && row.getEndDate() != null
                    && !row.getEndDate().isAfter(row.getStartDate())) {
                return true;
            }
        }
        return false;
    }

    private static int clampNotify(int n) {
        if (n == 1 || n == 3 || n == 7) {
            return n;
        }
        return 3;
    }
}
