package com.example.app.entity;

@Entity
public class TicketUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private String updatedBy;

    private LocalDateTime timestamp;

    @ManyToOne
    private Ticket ticket;
}
