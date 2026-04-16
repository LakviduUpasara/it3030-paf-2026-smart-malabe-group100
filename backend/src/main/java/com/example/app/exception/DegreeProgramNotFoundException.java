package com.example.app.exception;

public class DegreeProgramNotFoundException extends RuntimeException {

    public DegreeProgramNotFoundException(Long degreeProgramId) {
        super("Degree program not found with id: " + degreeProgramId);
    }
}
