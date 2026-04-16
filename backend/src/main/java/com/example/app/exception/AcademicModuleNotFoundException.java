package com.example.app.exception;

public class AcademicModuleNotFoundException extends RuntimeException {

    public AcademicModuleNotFoundException(Long academicModuleId) {
        super("Academic module not found with id: " + academicModuleId);
    }
}
