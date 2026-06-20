package com.minierp.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardKpisResponse {
    private BigDecimal totalSalesValue;
    private BigDecimal totalPurchaseValue;
    private long pendingSalesOrders;
    private long pendingManufacturingOrders;
    private long totalProducts;
    private BigDecimal totalStockValue;
}
