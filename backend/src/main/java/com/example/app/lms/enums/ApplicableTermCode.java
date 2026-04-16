package com.example.app.lms.enums;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public enum ApplicableTermCode {
    Y1S1,
    Y1S2,
    Y2S1,
    Y2S2,
    Y3S1,
    Y3S2,
    Y4S1,
    Y4S2;

    public static final List<ApplicableTermCode> ORDERED = Arrays.stream(values())
            .sorted(Comparator.comparing(Enum::name))
            .collect(Collectors.toList());

    public static boolean isValid(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        try {
            ApplicableTermCode.valueOf(raw.trim().toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
