package com.minierp.backend.controller;

import com.minierp.backend.model.SalesOrder;
import com.minierp.backend.service.SalesOrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    public ResponseEntity<List<SalesOrder>> getAllSalesOrders() {
        return ResponseEntity.ok(salesOrderService.getAllSalesOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrder> getSalesOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getSalesOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<SalesOrder> createSalesOrder(@Valid @RequestBody SalesOrder salesOrder) {
        return ResponseEntity.ok(salesOrderService.createSalesOrder(salesOrder));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<SalesOrder> updateSalesOrder(@PathVariable Long id, @Valid @RequestBody SalesOrder salesOrder) {
        return ResponseEntity.ok(salesOrderService.updateSalesOrder(id, salesOrder));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteSalesOrder(@PathVariable Long id) {
        salesOrderService.deleteSalesOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<SalesOrder> confirmSalesOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.confirmSalesOrder(id));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
    public ResponseEntity<SalesOrder> deliverSalesOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.deliverSalesOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<SalesOrder> cancelSalesOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.cancelSalesOrder(id));
    }
}
