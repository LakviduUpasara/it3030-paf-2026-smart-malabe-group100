package com.example.app.dto;

public record TicketAttachmentDownload(byte[] bytes, String contentType, String fileName) {}
