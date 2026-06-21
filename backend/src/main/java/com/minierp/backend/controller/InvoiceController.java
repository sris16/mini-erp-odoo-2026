package com.minierp.backend.controller;

import com.minierp.backend.model.Invoice;
import com.minierp.backend.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        return ResponseEntity.ok(invoiceService.createInvoice(invoice));
    }

    @PostMapping("/from-so/{soId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Invoice> createInvoiceFromSalesOrder(@PathVariable Long soId) {
        return ResponseEntity.ok(invoiceService.createInvoiceFromSalesOrder(soId));
    }

    @PostMapping("/from-mo/{moId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER', 'MANUFACTURING_USER')")
    public ResponseEntity<Invoice> createInvoiceFromMO(@PathVariable Long moId) {
        return ResponseEntity.ok(invoiceService.createInvoiceFromManufacturingOrder(moId));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Invoice> postInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.postInvoice(id));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Invoice> registerPayment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        return ResponseEntity.ok(invoiceService.registerPayment(id, amount));
    }
}
