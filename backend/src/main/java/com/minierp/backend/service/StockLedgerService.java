package com.minierp.backend.service;

import com.minierp.backend.model.AuditLog;
import com.minierp.backend.model.Product;
import com.minierp.backend.model.StockLedger;
import com.minierp.backend.model.StockMovementType;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.ProductRepository;
import com.minierp.backend.repository.StockLedgerRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StockLedgerService {

    private final ProductRepository productRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final AuditLogRepository auditLogRepository;

    public StockLedgerService(ProductRepository productRepository,
                              StockLedgerRepository stockLedgerRepository,
                              AuditLogRepository auditLogRepository) {
        this.productRepository = productRepository;
        this.stockLedgerRepository = stockLedgerRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logMovement(Product product, int qtyChanged, StockMovementType type, String sourceDocument) {
        if (qtyChanged <= 0) {
            throw new IllegalArgumentException("Quantity changed must be greater than zero");
        }

        int previousStock = product.getOnHandQty();
        int newStock = previousStock;

        if (type == StockMovementType.IN) {
            newStock += qtyChanged;
        } else if (type == StockMovementType.OUT) {
            newStock -= qtyChanged;
        }

        product.setOnHandQty(newStock);
        productRepository.save(product);

        StockLedger ledger = StockLedger.builder()
                .product(product)
                .qtyChanged(qtyChanged)
                .type(type)
                .sourceDocument(sourceDocument)
                .build();
        stockLedgerRepository.save(ledger);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_MOVEMENT")
                .details(String.format("Product: %s (%s) stock changed from %d to %d (diff: %d, type: %s) via %s",
                        product.getName(), product.getSku(), previousStock, newStock, qtyChanged, type, sourceDocument))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void reserveStock(Product product, int qtyToReserve) {
        if (qtyToReserve <= 0) {
            throw new IllegalArgumentException("Quantity to reserve must be greater than zero");
        }

        int previousReserved = product.getReservedQty();
        int newReserved = previousReserved + qtyToReserve;
        product.setReservedQty(newReserved);
        productRepository.save(product);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_RESERVATION")
                .details(String.format("Reserved %d units of product %s (%s). Reserved qty changed from %d to %d",
                        qtyToReserve, product.getName(), product.getSku(), previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void releaseStock(Product product, int qtyToRelease) {
        if (qtyToRelease <= 0) {
            throw new IllegalArgumentException("Quantity to release must be greater than zero");
        }

        int previousReserved = product.getReservedQty();
        int newReserved = Math.max(0, previousReserved - qtyToRelease);
        product.setReservedQty(newReserved);
        productRepository.save(product);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_RESERVATION_RELEASE")
                .details(String.format("Released %d units of product %s (%s). Reserved qty changed from %d to %d",
                        qtyToRelease, product.getName(), product.getSku(), previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void executeDelivery(Product product, int qtyToDeliver, String sourceDocument) {
        if (qtyToDeliver <= 0) {
            throw new IllegalArgumentException("Quantity to deliver must be greater than zero");
        }

        int previousStock = product.getOnHandQty();
        int previousReserved = product.getReservedQty();

        int newStock = previousStock - qtyToDeliver;
        int newReserved = Math.max(0, previousReserved - qtyToDeliver);

        product.setOnHandQty(newStock);
        product.setReservedQty(newReserved);
        productRepository.save(product);

        StockLedger ledger = StockLedger.builder()
                .product(product)
                .qtyChanged(qtyToDeliver)
                .type(StockMovementType.OUT)
                .sourceDocument(sourceDocument)
                .build();
        stockLedgerRepository.save(ledger);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_DELIVERY")
                .details(String.format("Delivered %d units of product %s (%s) via %s. OnHand: %d->%d, Reserved: %d->%d",
                        qtyToDeliver, product.getName(), product.getSku(), sourceDocument, previousStock, newStock, previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    public List<StockLedger> getLedgerForProduct(Long productId) {
        return stockLedgerRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    public List<StockLedger> getAllLedger() {
        return stockLedgerRepository.findAllByOrderByTimestampDesc();
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
