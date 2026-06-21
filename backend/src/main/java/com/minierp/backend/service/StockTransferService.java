package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockTransferService {

    private final StockTransferRepository stockTransferRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final LocationStockRepository locationStockRepository;
    private final ProductRepository productRepository;
    private final StockLedgerService stockLedgerService;
    private final AuditLogRepository auditLogRepository;

    public StockTransferService(StockTransferRepository stockTransferRepository,
                                WarehouseLocationRepository warehouseLocationRepository,
                                LocationStockRepository locationStockRepository,
                                ProductRepository productRepository,
                                StockLedgerService stockLedgerService,
                                AuditLogRepository auditLogRepository) {
        this.stockTransferRepository = stockTransferRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.locationStockRepository = locationStockRepository;
        this.productRepository = productRepository;
        this.stockLedgerService = stockLedgerService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<StockTransfer> getAllTransfers() {
        return stockTransferRepository.findAllByOrderByCreatedDateDesc();
    }

    public List<WarehouseLocation> getAllLocations() {
        return warehouseLocationRepository.findAll();
    }

    public List<LocationStock> getAllLocationStocks() {
        return locationStockRepository.findAll();
    }

    @Transactional
    public StockTransfer createTransfer(StockTransfer transfer) {
        if (transfer.getSourceLocation() == null || transfer.getSourceLocation().getId() == null) {
            throw new IllegalArgumentException("Source location is required");
        }
        if (transfer.getDestinationLocation() == null || transfer.getDestinationLocation().getId() == null) {
            throw new IllegalArgumentException("Destination location is required");
        }
        if (transfer.getSourceLocation().getId().equals(transfer.getDestinationLocation().getId())) {
            throw new IllegalArgumentException("Source and destination locations must be different");
        }
        if (transfer.getQty() == null || transfer.getQty() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        if (transfer.getProduct() == null || transfer.getProduct().getId() == null) {
            throw new IllegalArgumentException("Product is required");
        }

        // Retrieve full entities
        Product product = productRepository.findById(transfer.getProduct().getId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        WarehouseLocation src = warehouseLocationRepository.findById(transfer.getSourceLocation().getId())
                .orElseThrow(() -> new IllegalArgumentException("Source location not found"));
        WarehouseLocation dest = warehouseLocationRepository.findById(transfer.getDestinationLocation().getId())
                .orElseThrow(() -> new IllegalArgumentException("Destination location not found"));

        transfer.setProduct(product);
        transfer.setSourceLocation(src);
        transfer.setDestinationLocation(dest);
        transfer.setStatus("DRAFT");
        transfer.setCreatedDate(LocalDateTime.now());
        
        long count = stockTransferRepository.count() + 1;
        transfer.setTransferNumber("WH-TR-" + String.format("%03d", count));

        StockTransfer saved = stockTransferRepository.save(transfer);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_STOCK_TRANSFER")
                .details(String.format("Created draft stock transfer %s for %d units of %s from %s to %s",
                        saved.getTransferNumber(), saved.getQty(), product.getName(), src.getName(), dest.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return saved;
    }

    @Transactional
    public StockTransfer completeTransfer(Long id) {
        StockTransfer transfer = stockTransferRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));

        if (!"DRAFT".equals(transfer.getStatus())) {
            throw new IllegalStateException("Only DRAFT transfers can be completed");
        }

        Product product = transfer.getProduct();
        WarehouseLocation src = transfer.getSourceLocation();
        WarehouseLocation dest = transfer.getDestinationLocation();
        int qty = transfer.getQty();

        // Validate stock availability in source location
        LocationStock srcStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), src.getId())
                .orElseThrow(() -> new IllegalArgumentException("No stock record found for product at source location: " + src.getName()));

        int availableQty = srcStock.getOnHandQty() - srcStock.getReservedQty();
        if (availableQty < qty) {
            throw new IllegalArgumentException(String.format("Insufficient stock at %s. Available: %d, Required: %d",
                    src.getName(), availableQty, qty));
        }

        String doc = transfer.getTransferNumber();

        // 1. Move OUT of source
        stockLedgerService.logMovement(product, qty, StockMovementType.OUT, doc, src);

        // 2. Move IN to destination
        stockLedgerService.logMovement(product, qty, StockMovementType.IN, doc, dest);

        transfer.setStatus("COMPLETED");
        transfer.setCompletedDate(LocalDateTime.now());
        StockTransfer completed = stockTransferRepository.save(transfer);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("COMPLETE_STOCK_TRANSFER")
                .details(String.format("Completed stock transfer %s. Relocated %d units of %s from %s to %s",
                         doc, qty, product.getName(), src.getName(), dest.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return completed;
    }

    @Transactional
    public WarehouseLocation createLocation(WarehouseLocation location) {
        if (location.getName() == null || location.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Location name is required");
        }
        if (location.getCode() == null || location.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Location code is required");
        }
        String code = location.getCode().trim().toUpperCase();
        if (warehouseLocationRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("Location with code '" + code + "' already exists");
        }
        location.setCode(code);
        location.setName(location.getName().trim());
        
        WarehouseLocation saved = warehouseLocationRepository.save(location);
        
        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_LOCATION")
                .details(String.format("Created new warehouse location %s (%s)", saved.getName(), saved.getCode()))
                .build();
        auditLogRepository.save(auditLog);
        
        return saved;
    }

    @Transactional
    public void deleteLocation(Long id) {
        WarehouseLocation location = warehouseLocationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));
        
        if ("MAIN".equals(location.getCode())) {
            throw new IllegalArgumentException("Cannot delete the default MAIN location");
        }

        List<LocationStock> stocks = locationStockRepository.findByLocationId(id);
        boolean hasStock = stocks.stream().anyMatch(s -> s.getOnHandQty() > 0);
        if (hasStock) {
            throw new IllegalStateException("Cannot delete location '" + location.getName() + "' because it currently contains active product stock");
        }

        locationStockRepository.deleteAll(stocks);
        warehouseLocationRepository.delete(location);
        
        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("DELETE_LOCATION")
                .details(String.format("Deleted warehouse location %s (%s)", location.getName(), location.getCode()))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public LocationStock addOrUpdateLocationStock(Long productId, Long locationId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        WarehouseLocation location = warehouseLocationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Location not found"));
        
        LocationStock existing = locationStockRepository.findByProductIdAndLocationId(productId, locationId).orElse(null);
        int currentQty = existing != null ? existing.getOnHandQty() : 0;
        int diff = quantity - currentQty;
        
        if (diff > 0) {
            stockLedgerService.logMovement(product, diff, StockMovementType.IN, "Manual Adjustment", location);
        } else if (diff < 0) {
            stockLedgerService.logMovement(product, -diff, StockMovementType.OUT, "Manual Adjustment", location);
        }
        
        return locationStockRepository.findByProductIdAndLocationId(productId, locationId)
                .orElseThrow(() -> new IllegalStateException("Failed to update location stock"));
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
