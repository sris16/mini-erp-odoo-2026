package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.ProductRepository;
import com.minierp.backend.repository.PurchaseOrderRepository;
import com.minierp.backend.dto.PartialReceiptRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final StockLedgerService stockLedgerService;
    private final AuditLogRepository auditLogRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                ProductRepository productRepository,
                                StockLedgerService stockLedgerService,
                                AuditLogRepository auditLogRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.productRepository = productRepository;
        this.stockLedgerService = stockLedgerService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAllByOrderByOrderDateDesc();
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found with id: " + id));
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrder po) {
        po.setStatus(PurchaseOrderStatus.DRAFT);
        po.setOrderDate(LocalDateTime.now());
        if (po.getLines() != null) {
            for (PurchaseOrderLine line : po.getLines()) {
                line.setPurchaseOrder(po);
                line.setQtyReceived(0);
            }
        }

        PurchaseOrder savedPo = purchaseOrderRepository.save(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_PURCHASE_ORDER")
                .details(String.format("Created Purchase Order ID %d for vendor %s in DRAFT status",
                        savedPo.getId(), savedPo.getVendorName()))
                .build();
        auditLogRepository.save(auditLog);

        return savedPo;
    }

    @Transactional
    public PurchaseOrder updatePurchaseOrder(Long id, PurchaseOrder poDetails) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot update Purchase Order that is not in DRAFT status");
        }

        po.setVendorName(poDetails.getVendorName());
        
        // Rebuild lines
        po.getLines().clear();
        if (poDetails.getLines() != null) {
            for (PurchaseOrderLine line : poDetails.getLines()) {
                line.setPurchaseOrder(po);
                line.setQtyReceived(0);
                po.getLines().add(line);
            }
        }

        PurchaseOrder updatedPo = purchaseOrderRepository.save(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("UPDATE_PURCHASE_ORDER")
                .details(String.format("Updated Purchase Order ID %d. New total lines: %d", id, updatedPo.getLines().size()))
                .build();
        auditLogRepository.save(auditLog);

        return updatedPo;
    }

    @Transactional
    public void deletePurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrderStatus.DRAFT && po.getStatus() != PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException("Can only delete Purchase Orders in DRAFT or CANCELLED status");
        }

        purchaseOrderRepository.delete(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("DELETE_PURCHASE_ORDER")
                .details(String.format("Deleted Purchase Order ID %d", id))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public PurchaseOrder confirmPurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Purchase Order is already " + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.CONFIRMED);
        PurchaseOrder confirmedPo = purchaseOrderRepository.save(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CONFIRM_PURCHASE_ORDER")
                .details(String.format("Confirmed Purchase Order ID %d. Sent request to vendor %s", id, confirmedPo.getVendorName()))
                .build();
        auditLogRepository.save(auditLog);

        return confirmedPo;
    }

    @Transactional
    public PurchaseOrder receivePurchaseOrder(Long id) {
        return receivePurchaseOrder(id, null);
    }

    @Transactional
    public PurchaseOrder receivePurchaseOrder(Long id, List<PartialReceiptRequest> partialReceipts) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrderStatus.CONFIRMED && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new IllegalStateException("Only CONFIRMED or PARTIALLY_RECEIVED Purchase Orders can be received");
        }

        String sourceDoc = "PO-" + id;

        // 1. Receive quantities per line
        for (PurchaseOrderLine line : po.getLines()) {
            Product product = line.getProduct();
            int remaining = line.getQtyOrdered() - (line.getQtyReceived() != null ? line.getQtyReceived() : 0);
            if (remaining <= 0) continue;

            int qtyToReceive = remaining;
            if (partialReceipts != null && !partialReceipts.isEmpty()) {
                qtyToReceive = partialReceipts.stream()
                        .filter(p -> p.getProductId().equals(product.getId()))
                        .map(PartialReceiptRequest::getQtyToReceive)
                        .findFirst()
                        .orElse(0); // If product is not in partial list, do not receive
            }

            if (qtyToReceive <= 0) continue;

            if (qtyToReceive > remaining) {
                throw new IllegalArgumentException(String.format("Cannot receive more than remaining quantity (%d) for product %s", remaining, product.getName()));
            }

            // Calculate Weighted Average Cost (WAC)
            java.math.BigDecimal currentOnHand = java.math.BigDecimal.valueOf(product.getOnHandQty());
            java.math.BigDecimal currentCost = product.getCostPrice() != null ? product.getCostPrice() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal receivedQty = java.math.BigDecimal.valueOf(qtyToReceive);
            java.math.BigDecimal purchasePrice = line.getUnitPrice() != null ? line.getUnitPrice() : java.math.BigDecimal.ZERO;

            java.math.BigDecimal totalCurrentValuation = currentOnHand.multiply(currentCost);
            java.math.BigDecimal totalNewValuation = receivedQty.multiply(purchasePrice);
            java.math.BigDecimal totalQty = currentOnHand.add(receivedQty);

            java.math.BigDecimal newCostPrice = currentCost;
            if (totalQty.compareTo(java.math.BigDecimal.ZERO) > 0) {
                newCostPrice = totalCurrentValuation.add(totalNewValuation)
                        .divide(totalQty, 2, java.math.RoundingMode.HALF_UP);
            }
            product.setCostPrice(newCostPrice);
            productRepository.save(product);

            stockLedgerService.logMovement(product, qtyToReceive, StockMovementType.IN, sourceDoc);
            line.setQtyReceived((line.getQtyReceived() != null ? line.getQtyReceived() : 0) + qtyToReceive);
        }

        // 2. Update status
        boolean allFullyReceived = true;
        boolean anyReceived = false;
        for (PurchaseOrderLine line : po.getLines()) {
            int received = line.getQtyReceived() != null ? line.getQtyReceived() : 0;
            if (received < line.getQtyOrdered()) {
                allFullyReceived = false;
            }
            if (received > 0) {
                anyReceived = true;
            }
        }

        if (allFullyReceived) {
            po.setStatus(PurchaseOrderStatus.FULLY_RECEIVED);
        } else if (anyReceived) {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }

        PurchaseOrder receivedPo = purchaseOrderRepository.save(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("RECEIVE_PURCHASE_ORDER")
                .details(String.format("Processed receipt for Purchase Order ID %d. Status is now %s.", id, po.getStatus()))
                .build();
        auditLogRepository.save(auditLog);

        // 3. Trigger Scheduler Run: Reallocate reservations for all products
        runReservationScheduler();

        return receivedPo;
    }

    @Transactional
    public PurchaseOrder cancelPurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() == PurchaseOrderStatus.FULLY_RECEIVED) {
            throw new IllegalStateException("Cannot cancel an already received Purchase Order");
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        PurchaseOrder cancelledPo = purchaseOrderRepository.save(po);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CANCEL_PURCHASE_ORDER")
                .details(String.format("Cancelled Purchase Order ID %d", id))
                .build();
        auditLogRepository.save(auditLog);

        return cancelledPo;
    }

    @Transactional
    public void runReservationScheduler() {
        stockLedgerService.runReservationScheduler();
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
