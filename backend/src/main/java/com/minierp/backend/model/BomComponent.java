package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bom_components")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private Bom bom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "component_product_id", nullable = false)
    private Product component;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;
}
