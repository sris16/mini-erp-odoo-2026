package com.minierp.backend.controller;

import com.minierp.backend.model.Vendor;
import com.minierp.backend.model.AuditLog;
import com.minierp.backend.repository.VendorRepository;
import com.minierp.backend.repository.AuditLogRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendors")
public class VendorController {

    private final VendorRepository vendorRepository;
    private final AuditLogRepository auditLogRepository;

    public VendorController(VendorRepository vendorRepository, AuditLogRepository auditLogRepository) {
        this.vendorRepository = vendorRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<Vendor> createVendor(@Valid @RequestBody Vendor vendor) {
        Vendor savedVendor = vendorRepository.save(vendor);

        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("CREATE_VENDOR")
                .details(String.format("Created vendor ID %d: %s", savedVendor.getId(), savedVendor.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(savedVendor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<Vendor> updateVendor(@PathVariable Long id, @Valid @RequestBody Vendor vendorDetails) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with id: " + id));
        vendor.setName(vendorDetails.getName());
        vendor.setPhone(vendorDetails.getPhone());
        vendor.setEmail(vendorDetails.getEmail());
        vendor.setAddress(vendorDetails.getAddress());
        Vendor updatedVendor = vendorRepository.save(vendor);

        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("UPDATE_VENDOR")
                .details(String.format("Updated vendor ID %d: %s", id, updatedVendor.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(updatedVendor);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with id: " + id));
        vendorRepository.delete(vendor);

        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("DELETE_VENDOR")
                .details(String.format("Deleted vendor ID %d: %s", id, vendor.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.noContent().build();
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
