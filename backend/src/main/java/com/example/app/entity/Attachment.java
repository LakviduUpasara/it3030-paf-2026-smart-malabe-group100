package com.example.app.entity;

import org.springframework.data.annotation.Id;

/**
 * Embedded subdocument within {@link Ticket#attachments}.
 * {@code @Id} maps the Java {@code id} property to MongoDB's {@code _id} in each embedded document.
 */
public class Attachment {

    @Id
    private String id;
    private String fileName;
    private String filePath;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}
