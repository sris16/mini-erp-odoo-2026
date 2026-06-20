package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transfers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transferNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer qty;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_location_id", nullable = false)
    private WarehouseLocation sourceLocation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_location_id", nullable = false)
    private WarehouseLocation destinationLocation;

    @Column(nullable = false)
    private String status; // DRAFT, COMPLETED, CANCELLED

    @Column(nullable = false)
    private LocalDateTime createdDate;

    private LocalDateTime completedDate;
}
