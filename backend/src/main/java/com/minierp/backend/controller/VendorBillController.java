package com.minierp.backend.controller;

import com.minierp.backend.model.VendorBill;
import com.minierp.backend.service.VendorBillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bills")
public class VendorBillController {

    private final VendorBillService vendorBillService;

    public VendorBillController(VendorBillService vendorBillService) {
        this.vendorBillService = vendorBillService;
    }

    @GetMapping
    public ResponseEntity<List<VendorBill>> getAllBills() {
        return ResponseEntity.ok(vendorBillService.getAllBills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorBill> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorBillService.getBillById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<VendorBill> createBill(@RequestBody VendorBill bill) {
        return ResponseEntity.ok(vendorBillService.createBill(bill));
    }

    @PostMapping("/from-po/{poId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<VendorBill> createBillFromPurchaseOrder(@PathVariable Long poId) {
        return ResponseEntity.ok(vendorBillService.createBillFromPurchaseOrder(poId));
    }

    @PostMapping("/from-mo/{moId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER', 'MANUFACTURING_USER')")
    public ResponseEntity<VendorBill> createBillFromMO(@PathVariable Long moId) {
        return ResponseEntity.ok(vendorBillService.createBillFromManufacturingOrder(moId));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<VendorBill> postBill(@PathVariable Long id) {
        return ResponseEntity.ok(vendorBillService.postBill(id));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<VendorBill> registerPayment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        return ResponseEntity.ok(vendorBillService.registerPayment(id, amount));
    }
}
