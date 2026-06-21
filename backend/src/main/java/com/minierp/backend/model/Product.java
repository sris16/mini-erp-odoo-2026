package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private BigDecimal salesPrice;

    @Column(nullable = false)
    private BigDecimal costPrice;

    @Builder.Default
    @Column(nullable = false)
    private Integer onHandQty = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer reservedQty = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcurementStrategy procurementStrategy = ProcurementStrategy.MTS;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcurementType procurementType = ProcurementType.PURCHASE;

    private String vendor;

    private Long bomId;

    @Transient
    private java.util.List<com.minierp.backend.dto.BomDto.ComponentDto> bomComponents;

    // Transient helper for JSON serialization
    public Integer getFreeToUseQty() {
        int onHand = onHandQty != null ? onHandQty : 0;
        int reserved = reservedQty != null ? reservedQty : 0;
        return onHand - reserved;
    }
}
