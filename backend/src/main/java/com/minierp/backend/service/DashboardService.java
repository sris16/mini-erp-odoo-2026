package com.minierp.backend.service;

import com.minierp.backend.dto.*;
import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ManufacturingOrderRepository manufacturingOrderRepository;

    public DashboardService(ProductRepository productRepository,
                            SalesOrderRepository salesOrderRepository,
                            PurchaseOrderRepository purchaseOrderRepository,
                            ManufacturingOrderRepository manufacturingOrderRepository) {
        this.productRepository = productRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.manufacturingOrderRepository = manufacturingOrderRepository;
    }

    public DashboardKpisResponse getKpis() {
        List<Product> products = productRepository.findAll();
        List<SalesOrder> salesOrders = salesOrderRepository.findAll();
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findAll();
        List<ManufacturingOrder> manufacturingOrders = manufacturingOrderRepository.findAll();

        BigDecimal totalSalesValue = BigDecimal.ZERO;
        for (SalesOrder so : salesOrders) {
            if (so.getStatus() == SalesOrderStatus.CONFIRMED || 
                so.getStatus() == SalesOrderStatus.FULLY_DELIVERED || 
                so.getStatus() == SalesOrderStatus.PARTIALLY_DELIVERED) {
                
                for (SalesOrderLine line : so.getLines()) {
                    BigDecimal price = line.getUnitPrice() != null ? line.getUnitPrice() : BigDecimal.ZERO;
                    int qty = line.getQtyOrdered() != null ? line.getQtyOrdered() : 0;
                    totalSalesValue = totalSalesValue.add(price.multiply(BigDecimal.valueOf(qty)));
                }
            }
        }

        BigDecimal totalPurchaseValue = BigDecimal.ZERO;
        for (PurchaseOrder po : purchaseOrders) {
            if (po.getStatus() == PurchaseOrderStatus.CONFIRMED || 
                po.getStatus() == PurchaseOrderStatus.FULLY_RECEIVED || 
                po.getStatus() == PurchaseOrderStatus.PARTIALLY_RECEIVED) {
                
                for (PurchaseOrderLine line : po.getLines()) {
                    BigDecimal cost = line.getUnitPrice() != null ? line.getUnitPrice() : BigDecimal.ZERO;
                    int qty = line.getQtyOrdered() != null ? line.getQtyOrdered() : 0;
                    totalPurchaseValue = totalPurchaseValue.add(cost.multiply(BigDecimal.valueOf(qty)));
                }
            }
        }

        long pendingSales = salesOrders.stream()
                .filter(so -> so.getStatus() == SalesOrderStatus.DRAFT || so.getStatus() == SalesOrderStatus.CONFIRMED)
                .count();

        long pendingMOs = manufacturingOrders.stream()
                .filter(mo -> mo.getStatus() == ManufacturingOrderStatus.DRAFT || 
                              mo.getStatus() == ManufacturingOrderStatus.CONFIRMED || 
                              mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS)
                .count();

        long totalProducts = products.size();

        BigDecimal totalStockValue = BigDecimal.ZERO;
        for (Product p : products) {
            BigDecimal cost = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
            int onHand = p.getOnHandQty() != null ? p.getOnHandQty() : 0;
            totalStockValue = totalStockValue.add(cost.multiply(BigDecimal.valueOf(onHand)));
        }

        return DashboardKpisResponse.builder()
                .totalSalesValue(totalSalesValue)
                .totalPurchaseValue(totalPurchaseValue)
                .pendingSalesOrders(pendingSales)
                .pendingManufacturingOrders(pendingMOs)
                .totalProducts(totalProducts)
                .totalStockValue(totalStockValue)
                .build();
    }

    public DashboardChartsResponse getCharts() {
        List<SalesOrder> salesOrders = salesOrderRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Compute sales trend over time
        Map<String, BigDecimal> salesByDay = new HashMap<>();
        // Seed default days or just aggregate what we have
        for (SalesOrder so : salesOrders) {
            if ((so.getStatus() == SalesOrderStatus.CONFIRMED || 
                 so.getStatus() == SalesOrderStatus.FULLY_DELIVERED || 
                 so.getStatus() == SalesOrderStatus.PARTIALLY_DELIVERED) && so.getOrderDate() != null) {
                
                String day = so.getOrderDate().format(formatter);
                BigDecimal orderTotal = BigDecimal.ZERO;
                for (SalesOrderLine line : so.getLines()) {
                    BigDecimal price = line.getUnitPrice() != null ? line.getUnitPrice() : BigDecimal.ZERO;
                    int qty = line.getQtyOrdered() != null ? line.getQtyOrdered() : 0;
                    orderTotal = orderTotal.add(price.multiply(BigDecimal.valueOf(qty)));
                }
                salesByDay.put(day, salesByDay.getOrDefault(day, BigDecimal.ZERO).add(orderTotal));
            }
        }

        List<SalesTrendDto> salesTrend = salesByDay.entrySet().stream()
                .map(entry -> new SalesTrendDto(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(SalesTrendDto::getDate))
                .collect(Collectors.toList());

        // Compute product performance (quantity ordered)
        Map<String, Long> productVolume = new HashMap<>();
        for (SalesOrder so : salesOrders) {
            if (so.getStatus() == SalesOrderStatus.CONFIRMED || 
                so.getStatus() == SalesOrderStatus.FULLY_DELIVERED || 
                so.getStatus() == SalesOrderStatus.PARTIALLY_DELIVERED) {
                
                for (SalesOrderLine line : so.getLines()) {
                    if (line.getProduct() != null) {
                        String productName = line.getProduct().getName();
                        int qty = line.getQtyOrdered() != null ? line.getQtyOrdered() : 0;
                        productVolume.put(productName, productVolume.getOrDefault(productName, 0L) + qty);
                    }
                }
            }
        }

        List<ProductPerformanceDto> topProducts = productVolume.entrySet().stream()
                .map(entry -> new ProductPerformanceDto(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Long.compare(b.getQuantityOrdered(), a.getQuantityOrdered())) // Descending
                .limit(5)
                .collect(Collectors.toList());

        return DashboardChartsResponse.builder()
                .salesTrend(salesTrend)
                .topProducts(topProducts)
                .build();
    }
}
