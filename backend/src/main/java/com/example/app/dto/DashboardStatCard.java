package com.example.app.dto;

public class DashboardStatCard {

    private String title;
    private long value;
    private String note;

    public DashboardStatCard() {
    }

    public DashboardStatCard(String title, long value, String note) {
        this.title = title;
        this.value = value;
        this.note = note;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
