package com.example.app.registration;

import java.util.Locale;
import java.util.regex.Pattern;

public final class RegistrationStringUtils {

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-zA-Z0-9]+");

    private RegistrationStringUtils() {}

    public static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public static String sanitizePersonName(String s) {
        String t = trimToNull(s);
        return t == null ? null : t.replaceAll("\\s+", " ");
    }

    public static String sanitizeOptionalContact(String s) {
        return trimToNull(s);
    }

    public static String buildLecturerEmailLocalPart(String fullName) {
        String base = sanitizePersonName(fullName);
        if (base == null || base.isBlank()) {
            return "lecturer";
        }
        String slug = NON_ALNUM.matcher(base.toLowerCase(Locale.ROOT)).replaceAll(".");
        slug = slug.replaceAll("^\\.+|\\.+$", "");
        if (slug.isEmpty()) {
            slug = "lecturer";
        }
        return slug.length() > 40 ? slug.substring(0, 40) : slug;
    }

    public static String buildLabAssistantEmailLocalPart(String fullName) {
        String base = buildLecturerEmailLocalPart(fullName);
        if ("lecturer".equals(base)) {
            return "lab";
        }
        return base + ".lab";
    }
}
