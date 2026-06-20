package com.minierp.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "manufacturing_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManufacturingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "finished_product_id", nullable = false)
    private Product finishedProduct;

    @Column(nullable = false)
    private Integer qty;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ManufacturingOrderStatus status = ManufacturingOrderStatus.DRAFT;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bom_id")
    private Bom bom;

    @OneToMany(mappedBy = "manufacturingOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkOrder> workOrders = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }
}
