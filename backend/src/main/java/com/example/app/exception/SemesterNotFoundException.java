package com.example.app.exception;

public class SemesterNotFoundException extends RuntimeException {

    public SemesterNotFoundException(Long semesterId) {
        super("Semester not found with id: " + semesterId);
    }
}
