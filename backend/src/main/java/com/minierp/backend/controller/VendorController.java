package com.minierp.backend.controller;

import com.minierp.backend.model.Vendor;
import com.minierp.backend.repository.VendorRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendors")
public class VendorController {

    private final VendorRepository vendorRepository;

    public VendorController(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE_USER')")
    public ResponseEntity<Vendor> createVendor(@Valid @RequestBody Vendor vendor) {
        return ResponseEntity.ok(vendorRepository.save(vendor));
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
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found with id: " + id));
        vendorRepository.delete(vendor);
        return ResponseEntity.noContent().build();
    }
}
