package com.example.app.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardSummaryResponse {

    private List<DashboardStatCard> cards = new ArrayList<>();

    public List<DashboardStatCard> getCards() {
        return cards;
    }

    public void setCards(List<DashboardStatCard> cards) {
        this.cards = cards != null ? cards : new ArrayList<>();
    }
}
