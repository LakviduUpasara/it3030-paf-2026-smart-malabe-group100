package com.example.app.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceId) {
        super("Resource not found with id: " + resourceId);
    }
}
