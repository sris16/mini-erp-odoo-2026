package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reordering_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    private Integer minQty;

    @Column(nullable = false)
    private Integer maxQty;

    private LocalDateTime lastTriggered;
}
