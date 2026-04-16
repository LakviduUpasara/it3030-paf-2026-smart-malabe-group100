package com.example.app.registration;

import java.util.Locale;

public final class IntakeMonthUtils {

    private IntakeMonthUtils() {}

    public static String sanitizeIntakeMonth(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String t = raw.trim();
        for (String m : IntakeConstants.MONTHS) {
            if (m.equalsIgnoreCase(t)) {
                return m;
            }
        }
        return "";
    }

    /** 1–12 or 0 if unknown. */
    public static int monthNumber(String canonicalMonth) {
        if (canonicalMonth == null) {
            return 0;
        }
        for (int i = 0; i < IntakeConstants.MONTHS.size(); i++) {
            if (IntakeConstants.MONTHS.get(i).equalsIgnoreCase(canonicalMonth.trim())) {
                return i + 1;
            }
        }
        return 0;
    }

    public static String normalizeName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
