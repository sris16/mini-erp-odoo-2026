package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.VendorBillRepository;
import com.minierp.backend.repository.PurchaseOrderRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VendorBillService {

    private final VendorBillRepository vendorBillRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogRepository auditLogRepository;

    public VendorBillService(VendorBillRepository vendorBillRepository,
                             PurchaseOrderRepository purchaseOrderRepository,
                             AuditLogRepository auditLogRepository) {
        this.vendorBillRepository = vendorBillRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<VendorBill> getAllBills() {
        return vendorBillRepository.findAllByOrderByIssueDateDesc();
    }

    public VendorBill getBillById(Long id) {
        return vendorBillRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor Bill not found with id: " + id));
    }

    @Transactional
    public VendorBill createBill(VendorBill bill) {
        bill.setStatus(InvoiceStatus.DRAFT);
        bill.setIssueDate(LocalDateTime.now());
        bill.setAmountPaid(BigDecimal.ZERO);
        
        if (bill.getLines() != null) {
            for (VendorBillLine line : bill.getLines()) {
                line.setVendorBill(bill);
            }
        }
        
        VendorBill savedBill = vendorBillRepository.save(bill);
        logAudit("CREATE_VENDOR_BILL", String.format("Created vendor bill %s from vendor %s in DRAFT status", 
                savedBill.getBillNumber(), savedBill.getVendorName()));
        return savedBill;
    }

    @Transactional
    public VendorBill createBillFromPurchaseOrder(Long purchaseOrderId) {
        // Check if bill already exists
        List<VendorBill> existingBills = vendorBillRepository.findAll();
        for (VendorBill bill : existingBills) {
            if (purchaseOrderId.equals(bill.getPurchaseOrderId())) {
                throw new IllegalStateException("Vendor Bill already exists for Purchase Order ID " + purchaseOrderId);
            }
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found with id: " + purchaseOrderId));

        if (purchaseOrder.getStatus() == PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot bill a Purchase Order in DRAFT status");
        }

        List<VendorBillLine> billLines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        VendorBill bill = VendorBill.builder()
                .purchaseOrderId(purchaseOrderId)
                .vendorName(purchaseOrder.getVendorName())
                .status(InvoiceStatus.DRAFT)
                .issueDate(LocalDateTime.now())
                .amountPaid(BigDecimal.ZERO)
                .build();

        for (PurchaseOrderLine poLine : purchaseOrder.getLines()) {
            int qtyToBill = poLine.getQtyReceived();
            if (qtyToBill <= 0) {
                // Fallback to ordered quantity if nothing has been formally received yet
                qtyToBill = poLine.getQtyOrdered();
            }

            BigDecimal lineTotal = poLine.getUnitPrice().multiply(BigDecimal.valueOf(qtyToBill));
            totalAmount = totalAmount.add(lineTotal);

            VendorBillLine billLine = VendorBillLine.builder()
                    .vendorBill(bill)
                    .product(poLine.getProduct())
                    .quantity(qtyToBill)
                    .unitPrice(poLine.getUnitPrice())
                    .build();

            billLines.add(billLine);
        }

        if (billLines.isEmpty()) {
            throw new IllegalStateException("Cannot create vendor bill: Purchase Order has no lines.");
        }

        bill.setLines(billLines);
        bill.setTotalAmount(totalAmount);

        VendorBill savedBill = vendorBillRepository.save(bill);
        logAudit("CREATE_BILL_FROM_PO", String.format("Generated Draft Vendor Bill %s from Purchase Order ID %d",
                savedBill.getBillNumber(), purchaseOrderId));

        return savedBill;
    }

    @Transactional
    public VendorBill postBill(Long id) {
        VendorBill bill = getBillById(id);
        if (bill.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT bills can be posted");
        }

        bill.setStatus(InvoiceStatus.POSTED);
        VendorBill updatedBill = vendorBillRepository.save(bill);
        logAudit("POST_VENDOR_BILL", String.format("Posted Vendor Bill %s", updatedBill.getBillNumber()));
        return updatedBill;
    }

    @Transactional
    public VendorBill registerPayment(Long id, BigDecimal amount) {
        VendorBill bill = getBillById(id);
        if (bill.getStatus() == InvoiceStatus.DRAFT || bill.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot register payment for DRAFT or CANCELLED bill");
        }

        BigDecimal newAmountPaid = bill.getAmountPaid().add(amount);
        if (newAmountPaid.compareTo(bill.getTotalAmount()) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds total unpaid bill amount");
        }

        bill.setAmountPaid(newAmountPaid);
        if (newAmountPaid.compareTo(bill.getTotalAmount()) >= 0) {
            bill.setStatus(InvoiceStatus.PAID);
        }

        VendorBill updatedBill = vendorBillRepository.save(bill);
        logAudit("REGISTER_BILL_PAYMENT", String.format("Registered payment of $%s for Vendor Bill %s. Status is now %s",
                amount.toString(), updatedBill.getBillNumber(), updatedBill.getStatus().name()));
        return updatedBill;
    }

    private void logAudit(String action, String details) {
        String username = "SYSTEM";
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
        }
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action(action)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }
}
