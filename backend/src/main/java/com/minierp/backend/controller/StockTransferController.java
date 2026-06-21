package com.minierp.backend.controller;

import com.minierp.backend.model.*;
import com.minierp.backend.dto.LocationStockRequest;
import com.minierp.backend.service.StockTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class StockTransferController {

    private final StockTransferService stockTransferService;

    public StockTransferController(StockTransferService stockTransferService) {
        this.stockTransferService = stockTransferService;
    }

    @GetMapping("/locations")
    public ResponseEntity<List<WarehouseLocation>> getLocations() {
        return ResponseEntity.ok(stockTransferService.getAllLocations());
    }

    @PostMapping("/locations")
    public ResponseEntity<?> createLocation(@RequestBody WarehouseLocation location) {
        try {
            WarehouseLocation created = stockTransferService.createLocation(location);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/locations/stock")
    public ResponseEntity<List<LocationStock>> getLocationStocks() {
        return ResponseEntity.ok(stockTransferService.getAllLocationStocks());
    }

    @PostMapping("/locations/stock")
    public ResponseEntity<?> updateLocationStock(@RequestBody LocationStockRequest request) {
        try {
            if (request.getProductId() == null) {
                throw new IllegalArgumentException("Product ID is required");
            }
            if (request.getLocationId() == null) {
                throw new IllegalArgumentException("Location ID is required");
            }
            if (request.getQuantity() == null || request.getQuantity() < 0) {
                throw new IllegalArgumentException("Quantity must be non-negative");
            }
            LocationStock updated = stockTransferService.addOrUpdateLocationStock(
                    request.getProductId(), request.getLocationId(), request.getQuantity()
            );
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/locations/{id}")
    public ResponseEntity<?> deleteLocation(@PathVariable Long id) {
        try {
            stockTransferService.deleteLocation(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/transfers")
    public ResponseEntity<List<StockTransfer>> getTransfers() {
        return ResponseEntity.ok(stockTransferService.getAllTransfers());
    }

    @PostMapping("/transfers")
    public ResponseEntity<?> createTransfer(@RequestBody StockTransfer transfer) {
        try {
            StockTransfer created = stockTransferService.createTransfer(transfer);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/transfers/{id}/complete")
    public ResponseEntity<?> completeTransfer(@PathVariable Long id) {
        try {
            StockTransfer completed = stockTransferService.completeTransfer(id);
            return ResponseEntity.ok(completed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
