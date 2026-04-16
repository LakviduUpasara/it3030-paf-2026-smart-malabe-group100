package com.example.app.lms;

import java.util.regex.Pattern;

public final class LmsCodeUtils {

    private static final Pattern FACULTY_OR_DEGREE = Pattern.compile("^[A-Z]{2,6}$");
    private static final Pattern MODULE_CODE = Pattern.compile("^[A-Z0-9]{1,10}$");

    private LmsCodeUtils() {}

    public static String normalizeFacultyOrDegreeCode(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("[^A-Za-z]", "").toUpperCase();
    }

    public static String normalizeModuleCode(String raw) {
        if (raw == null) {
            return "";
        }
        String alnum = raw.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        return alnum.length() > 10 ? alnum.substring(0, 10) : alnum;
    }

    public static boolean isValidFacultyOrDegreeCode(String code) {
        return code != null && FACULTY_OR_DEGREE.matcher(code).matches();
    }

    public static boolean isValidModuleCode(String code) {
        return code != null && !code.isEmpty() && MODULE_CODE.matcher(code).matches();
    }
}
