package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "work_centers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Builder.Default
    @Column(nullable = false)
    private Integer capacity = 1;

    @Builder.Default
    @Column(nullable = true)
    private java.math.BigDecimal laborCostPerHour = java.math.BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = true)
    private java.math.BigDecimal overheadCostPerHour = java.math.BigDecimal.ZERO;
}
