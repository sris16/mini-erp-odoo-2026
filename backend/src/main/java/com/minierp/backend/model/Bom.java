package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "boms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finished_product_id", nullable = false)
    private Product finishedProduct;

    @Builder.Default
    @Column(nullable = false)
    private Integer productQty = 1;
}
