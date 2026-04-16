package com.example.app.exception;

public class StudentGroupNotFoundException extends RuntimeException {

    public StudentGroupNotFoundException(Long studentGroupId) {
        super("Student group not found with id: " + studentGroupId);
    }
}
