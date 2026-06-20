package com.minierp.backend.service;

import com.minierp.backend.model.AuditLog;
import com.minierp.backend.model.Product;
import com.minierp.backend.model.StockMovementType;
import com.minierp.backend.repository.AuditLogRepository;
import com.minierp.backend.repository.ProductRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockLedgerService stockLedgerService;
    private final AuditLogRepository auditLogRepository;

    public ProductService(ProductRepository productRepository,
                          StockLedgerService stockLedgerService,
                          AuditLogRepository auditLogRepository) {
        this.productRepository = productRepository;
        this.stockLedgerService = stockLedgerService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    public Product getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with SKU: " + sku));
    }

    @Transactional
    public Product createProduct(Product product) {
        // Enforce default initial quantities
        int initialStock = product.getOnHandQty() != null ? product.getOnHandQty() : 0;
        product.setOnHandQty(0); // Set to 0 first, will be set by ledger if initialStock > 0
        product.setReservedQty(0);

        Product savedProduct = productRepository.save(product);

        // If there was initial stock, seed it properly through the stock ledger
        if (initialStock > 0) {
            stockLedgerService.logMovement(savedProduct, initialStock, StockMovementType.IN, "Initial Stock Seed");
        }

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_PRODUCT")
                .details(String.format("Created product: %s (SKU: %s) with initial stock: %d",
                        savedProduct.getName(), savedProduct.getSku(), initialStock))
                .build();
        auditLogRepository.save(auditLog);

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);

        String previousDetails = String.format("Name: %s, SKU: %s, SalesPrice: %s, CostPrice: %s, Strategy: %s, Type: %s, Vendor: %s, BomId: %s",
                product.getName(), product.getSku(), product.getSalesPrice(), product.getCostPrice(),
                product.getProcurementStrategy(), product.getProcurementType(), product.getVendor(), product.getBomId());

        product.setName(productDetails.getName());
        product.setSku(productDetails.getSku());
        product.setSalesPrice(productDetails.getSalesPrice());
        product.setCostPrice(productDetails.getCostPrice());
        product.setProcurementStrategy(productDetails.getProcurementStrategy());
        product.setProcurementType(productDetails.getProcurementType());
        product.setVendor(productDetails.getVendor());
        product.setBomId(productDetails.getBomId());

        // Note: onHandQty and reservedQty are NOT modified here. That is done via stock ledger adjustments.
        Product updatedProduct = productRepository.save(product);

        String newDetails = String.format("Name: %s, SKU: %s, SalesPrice: %s, CostPrice: %s, Strategy: %s, Type: %s, Vendor: %s, BomId: %s",
                updatedProduct.getName(), updatedProduct.getSku(), updatedProduct.getSalesPrice(), updatedProduct.getCostPrice(),
                updatedProduct.getProcurementStrategy(), updatedProduct.getProcurementType(), updatedProduct.getVendor(), updatedProduct.getBomId());

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("UPDATE_PRODUCT")
                .details(String.format("Updated product ID %d. Old: [%s] -> New: [%s]", id, previousDetails, newDetails))
                .build();
        auditLogRepository.save(auditLog);

        return updatedProduct;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("DELETE_PRODUCT")
                .details(String.format("Deleted product: %s (SKU: %s)", product.getName(), product.getSku()))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void adjustStock(Long id, int qtyChanged, StockMovementType type, String reason) {
        Product product = getProductById(id);
        String doc = "Stock Adjustment: " + (reason != null && !reason.trim().isEmpty() ? reason : "Manual Adjust");
        stockLedgerService.logMovement(product, qtyChanged, type, doc);
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
