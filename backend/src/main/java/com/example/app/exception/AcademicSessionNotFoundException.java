package com.example.app.exception;

public class AcademicSessionNotFoundException extends RuntimeException {

    public AcademicSessionNotFoundException(Long academicSessionId) {
        super("Academic session not found with id: " + academicSessionId);
    }
}
