package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "location_stocks", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "location_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id", nullable = false)
    private WarehouseLocation location;

    @Builder.Default
    @Column(nullable = false)
    private Integer onHandQty = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer reservedQty = 0;
}
