package com.example.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "module_offerings",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"academic_module_id", "semester_id", "academic_year_label"}))
public class ModuleOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "academic_module_id", nullable = false)
    private AcademicModule academicModule;

    @ManyToOne(optional = false)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(name = "academic_year_label", nullable = false, length = 20)
    private String academicYearLabel;

    @Column(name = "coordinator_name", length = 120)
    private String coordinatorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModuleOfferingStatus status;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
