package com.minierp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_order_id", nullable = false)
    @JsonIgnore
    private ManufacturingOrder manufacturingOrder;

    @Column(nullable = false)
    private String operationName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "work_center_id", nullable = false)
    private WorkCenter workCenter;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderStatus status = WorkOrderStatus.READY;
}
