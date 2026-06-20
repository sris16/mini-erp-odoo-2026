package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.InvoiceRepository;
import com.minierp.backend.repository.SalesOrderRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditLogRepository auditLogRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          SalesOrderRepository salesOrderRepository,
                          AuditLogRepository auditLogRepository) {
        this.invoiceRepository = invoiceRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByIssueDateDesc();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setIssueDate(LocalDateTime.now());
        invoice.setAmountPaid(BigDecimal.ZERO);
        
        if (invoice.getLines() != null) {
            for (InvoiceLine line : invoice.getLines()) {
                line.setInvoice(invoice);
            }
        }
        
        Invoice savedInvoice = invoiceRepository.save(invoice);
        logAudit("CREATE_INVOICE", String.format("Created invoice %s for customer %s in DRAFT status", 
                savedInvoice.getInvoiceNumber(), savedInvoice.getCustomerName()));
        return savedInvoice;
    }

    @Transactional
    public Invoice createInvoiceFromSalesOrder(Long salesOrderId) {
        // Check if invoice already exists
        List<Invoice> existingInvoices = invoiceRepository.findAll();
        for (Invoice inv : existingInvoices) {
            if (salesOrderId.equals(inv.getSalesOrderId())) {
                throw new IllegalStateException("Invoice already exists for Sales Order ID " + salesOrderId);
            }
        }

        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Sales Order not found with id: " + salesOrderId));

        if (salesOrder.getStatus() == SalesOrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot invoice a Sales Order in DRAFT status");
        }

        List<InvoiceLine> invoiceLines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .salesOrderId(salesOrderId)
                .customerName(salesOrder.getCustomerName())
                .status(InvoiceStatus.DRAFT)
                .issueDate(LocalDateTime.now())
                .amountPaid(BigDecimal.ZERO)
                .build();

        for (SalesOrderLine soLine : salesOrder.getLines()) {
            int qtyToInvoice = soLine.getQtyDelivered();
            if (qtyToInvoice <= 0) {
                // If nothing was delivered yet, we invoice the ordered qty (standard fallback if partial shipment wasn't completed)
                qtyToInvoice = soLine.getQtyOrdered();
            }

            BigDecimal lineTotal = soLine.getUnitPrice().multiply(BigDecimal.valueOf(qtyToInvoice));
            totalAmount = totalAmount.add(lineTotal);

            InvoiceLine invLine = InvoiceLine.builder()
                    .invoice(invoice)
                    .product(soLine.getProduct())
                    .quantity(qtyToInvoice)
                    .unitPrice(soLine.getUnitPrice())
                    .build();

            invoiceLines.add(invLine);
        }

        if (invoiceLines.isEmpty()) {
            throw new IllegalStateException("Cannot create invoice: Sales Order has no lines.");
        }

        invoice.setLines(invoiceLines);
        invoice.setTotalAmount(totalAmount);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        logAudit("CREATE_INVOICE_FROM_SO", String.format("Generated Draft Invoice %s from Sales Order ID %d",
                savedInvoice.getInvoiceNumber(), salesOrderId));

        return savedInvoice;
    }

    @Transactional
    public Invoice postInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT invoices can be posted");
        }

        invoice.setStatus(InvoiceStatus.POSTED);
        Invoice updatedInvoice = invoiceRepository.save(invoice);
        logAudit("POST_INVOICE", String.format("Posted Invoice %s", updatedInvoice.getInvoiceNumber()));
        return updatedInvoice;
    }

    @Transactional
    public Invoice registerPayment(Long id, BigDecimal amount) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() == InvoiceStatus.DRAFT || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot register payment for DRAFT or CANCELLED invoice");
        }

        BigDecimal newAmountPaid = invoice.getAmountPaid().add(amount);
        if (newAmountPaid.compareTo(invoice.getTotalAmount()) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds total unpaid invoice amount");
        }

        invoice.setAmountPaid(newAmountPaid);
        if (newAmountPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        logAudit("REGISTER_INVOICE_PAYMENT", String.format("Registered payment of $%s for Invoice %s. Status is now %s",
                amount.toString(), updatedInvoice.getInvoiceNumber(), updatedInvoice.getStatus().name()));
        return updatedInvoice;
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
