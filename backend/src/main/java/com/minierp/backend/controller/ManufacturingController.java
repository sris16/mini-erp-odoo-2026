package com.minierp.backend.controller;

import com.minierp.backend.model.ManufacturingOrder;
import com.minierp.backend.model.WorkOrder;
import com.minierp.backend.service.ManufacturingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manufacturing")
public class ManufacturingController {

    private final ManufacturingService manufacturingService;

    public ManufacturingController(ManufacturingService manufacturingService) {
        this.manufacturingService = manufacturingService;
    }

    @GetMapping
    public ResponseEntity<List<ManufacturingOrder>> getAllManufacturingOrders() {
        return ResponseEntity.ok(manufacturingService.getAllManufacturingOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManufacturingOrder> getManufacturingOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.getManufacturingOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<ManufacturingOrder> createManufacturingOrder(@Valid @RequestBody ManufacturingOrder mo) {
        return ResponseEntity.ok(manufacturingService.createManufacturingOrder(mo));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<ManufacturingOrder> confirmManufacturingOrder(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.confirmManufacturingOrder(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<ManufacturingOrder> completeManufacturingOrder(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.completeManufacturingOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<ManufacturingOrder> cancelManufacturingOrder(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.cancelManufacturingOrder(id));
    }

    @PostMapping("/workorders/{woId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<WorkOrder> startWorkOrder(@PathVariable Long woId) {
        return ResponseEntity.ok(manufacturingService.startWorkOrder(woId));
    }

    @PostMapping("/workorders/{woId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING_USER')")
    public ResponseEntity<WorkOrder> completeWorkOrder(@PathVariable Long woId) {
        return ResponseEntity.ok(manufacturingService.completeWorkOrder(woId));
    }
}
