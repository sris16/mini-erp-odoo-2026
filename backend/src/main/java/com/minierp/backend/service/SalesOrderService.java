package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.SalesOrderRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final StockLedgerService stockLedgerService;
    private final ProcurementService procurementService;
    private final AuditLogRepository auditLogRepository;

    public SalesOrderService(SalesOrderRepository salesOrderRepository,
                             StockLedgerService stockLedgerService,
                             ProcurementService procurementService,
                             AuditLogRepository auditLogRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.stockLedgerService = stockLedgerService;
        this.procurementService = procurementService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<SalesOrder> getAllSalesOrders() {
        return salesOrderRepository.findAllByOrderByOrderDateDesc();
    }

    public SalesOrder getSalesOrderById(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sales Order not found with id: " + id));
    }

    @Transactional
    public SalesOrder createSalesOrder(SalesOrder salesOrder) {
        salesOrder.setStatus(SalesOrderStatus.DRAFT);
        salesOrder.setOrderDate(LocalDateTime.now());
        if (salesOrder.getLines() != null) {
            for (SalesOrderLine line : salesOrder.getLines()) {
                line.setSalesOrder(salesOrder);
                line.setQtyDelivered(0);
            }
        }

        SalesOrder savedOrder = salesOrderRepository.save(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_SALES_ORDER")
                .details(String.format("Created Sales Order ID %d for customer %s in DRAFT status",
                        savedOrder.getId(), savedOrder.getCustomerName()))
                .build();
        auditLogRepository.save(auditLog);

        return savedOrder;
    }

    @Transactional
    public SalesOrder updateSalesOrder(Long id, SalesOrder orderDetails) {
        SalesOrder salesOrder = getSalesOrderById(id);

        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot update Sales Order that is not in DRAFT status");
        }

        salesOrder.setCustomerName(orderDetails.getCustomerName());
        
        // Clear and rebuild lines
        salesOrder.getLines().clear();
        if (orderDetails.getLines() != null) {
            for (SalesOrderLine line : orderDetails.getLines()) {
                line.setSalesOrder(salesOrder);
                line.setQtyDelivered(0);
                salesOrder.getLines().add(line);
            }
        }

        SalesOrder updatedOrder = salesOrderRepository.save(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("UPDATE_SALES_ORDER")
                .details(String.format("Updated Sales Order ID %d. New total lines: %d", id, updatedOrder.getLines().size()))
                .build();
        auditLogRepository.save(auditLog);

        return updatedOrder;
    }

    @Transactional
    public void deleteSalesOrder(Long id) {
        SalesOrder salesOrder = getSalesOrderById(id);

        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT && salesOrder.getStatus() != SalesOrderStatus.CANCELLED) {
            throw new IllegalStateException("Can only delete Sales Orders in DRAFT or CANCELLED status");
        }

        salesOrderRepository.delete(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("DELETE_SALES_ORDER")
                .details(String.format("Deleted Sales Order ID %d", id))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public SalesOrder confirmSalesOrder(Long id) {
        SalesOrder salesOrder = getSalesOrderById(id);

        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT) {
            throw new IllegalStateException("Sales Order is already " + salesOrder.getStatus());
        }

        salesOrder.setStatus(SalesOrderStatus.CONFIRMED);

        String sourceDoc = "SO-" + id;

        for (SalesOrderLine line : salesOrder.getLines()) {
            Product product = line.getProduct();
            int qtyOrdered = line.getQtyOrdered();

            if (product.getProcurementStrategy() == ProcurementStrategy.MTS) {
                // Check free stock available
                int freeStock = product.getOnHandQty() - product.getReservedQty();
                int toReserve = Math.min(qtyOrdered, Math.max(0, freeStock));

                if (toReserve > 0) {
                    stockLedgerService.reserveStock(product, toReserve);
                }

                int shortage = qtyOrdered - toReserve;
                if (shortage > 0) {
                    // Trigger auto-procurement for the shortage amount
                    procurementService.autoProcure(product, shortage, sourceDoc);
                }
            } else if (product.getProcurementStrategy() == ProcurementStrategy.MTO) {
                // Make to Order triggers auto-procurement for the full quantity
                procurementService.autoProcure(product, qtyOrdered, sourceDoc);
            }
        }

        SalesOrder confirmedOrder = salesOrderRepository.save(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CONFIRM_SALES_ORDER")
                .details(String.format("Confirmed Sales Order ID %d. Reserved available stock and triggered auto-procurement for shortages.", id))
                .build();
        auditLogRepository.save(auditLog);

        return confirmedOrder;
    }

    @Transactional
    public SalesOrder deliverSalesOrder(Long id) {
        SalesOrder salesOrder = getSalesOrderById(id);

        if (salesOrder.getStatus() != SalesOrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED Sales Orders can be delivered");
        }

        // 1. Dry run: Verify all products have enough physical on-hand stock
        for (SalesOrderLine line : salesOrder.getLines()) {
            Product product = line.getProduct();
            int qtyOrdered = line.getQtyOrdered();
            if (product.getOnHandQty() < qtyOrdered) {
                throw new IllegalStateException(String.format("Cannot deliver. Insufficient physical stock for product %s (%s). On hand: %d, Required: %d",
                        product.getName(), product.getSku(), product.getOnHandQty(), qtyOrdered));
            }
        }

        // 2. Perform actual delivery and log movements
        String sourceDoc = "SO-" + id;
        for (SalesOrderLine line : salesOrder.getLines()) {
            Product product = line.getProduct();
            int qtyOrdered = line.getQtyOrdered();

            stockLedgerService.executeDelivery(product, qtyOrdered, sourceDoc);
            line.setQtyDelivered(qtyOrdered);
        }

        salesOrder.setStatus(SalesOrderStatus.FULLY_DELIVERED);
        SalesOrder deliveredOrder = salesOrderRepository.save(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("DELIVER_SALES_ORDER")
                .details(String.format("Delivered Sales Order ID %d. Deducted stock and logged OUT transactions.", id))
                .build();
        auditLogRepository.save(auditLog);

        return deliveredOrder;
    }

    @Transactional
    public SalesOrder cancelSalesOrder(Long id) {
        SalesOrder salesOrder = getSalesOrderById(id);

        if (salesOrder.getStatus() == SalesOrderStatus.FULLY_DELIVERED || salesOrder.getStatus() == SalesOrderStatus.PARTIALLY_DELIVERED) {
            throw new IllegalStateException("Cannot cancel an already delivered Sales Order");
        }

        if (salesOrder.getStatus() == SalesOrderStatus.CANCELLED) {
            return salesOrder;
        }

        // Release any reservations if the order was confirmed
        if (salesOrder.getStatus() == SalesOrderStatus.CONFIRMED) {
            for (SalesOrderLine line : salesOrder.getLines()) {
                Product product = line.getProduct();
                if (product.getProcurementStrategy() == ProcurementStrategy.MTS) {
                    // Release reserved stock up to the ordered qty
                    int toRelease = Math.min(line.getQtyOrdered(), product.getReservedQty());
                    if (toRelease > 0) {
                        stockLedgerService.releaseStock(product, toRelease);
                    }
                }
            }
        }

        salesOrder.setStatus(SalesOrderStatus.CANCELLED);
        SalesOrder cancelledOrder = salesOrderRepository.save(salesOrder);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CANCEL_SALES_ORDER")
                .details(String.format("Cancelled Sales Order ID %d and released any reserved stock.", id))
                .build();
        auditLogRepository.save(auditLog);

        return cancelledOrder;
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
