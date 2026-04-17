package com.example.app.util;

/**
 * Mirrors frontend {@code ticketDescription.js} meta parsing enough to read priority for analytics.
 */
public final class TicketDescriptionHelper {

    private static final String META_MARKER = "\n\n__META__\n";

    private TicketDescriptionHelper() {
    }

    public static String extractPriority(String description) {
        if (description == null || description.isBlank()) {
            return "Normal";
        }
        String metaBlock;
        if (description.contains(META_MARKER)) {
            String[] parts = description.split(META_MARKER, 2);
            metaBlock = parts.length > 1 ? parts[1] : "";
        } else if (description.contains("__META__")) {
            String[] parts = description.split("__META__", 2);
            metaBlock = parts.length > 1 ? parts[1] : "";
        } else {
            return "Normal";
        }
        for (String line : metaBlock.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            int idx = trimmed.indexOf(':');
            if (idx < 0) {
                continue;
            }
            String key = trimmed.substring(0, idx).trim();
            String value = trimmed.substring(idx + 1).trim();
            if ("priority".equalsIgnoreCase(key) && !value.isEmpty()) {
                return value;
            }
        }
        return "Normal";
    }

    public static boolean isUrgentPriority(String description) {
        String p = extractPriority(description);
        if (p == null || p.isBlank()) {
            return false;
        }
        String u = p.trim();
        return "High".equalsIgnoreCase(u) || "Critical".equalsIgnoreCase(u);
    }
}
