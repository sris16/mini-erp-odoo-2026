package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockLedgerService stockLedgerService;
    private final AuditLogRepository auditLogRepository;
    private final BomRepository bomRepository;
    private final BomComponentRepository bomComponentRepository;

    public ProductService(ProductRepository productRepository,
                          StockLedgerService stockLedgerService,
                          AuditLogRepository auditLogRepository,
                          BomRepository bomRepository,
                          BomComponentRepository bomComponentRepository) {
        this.productRepository = productRepository;
        this.stockLedgerService = stockLedgerService;
        this.auditLogRepository = auditLogRepository;
        this.bomRepository = bomRepository;
        this.bomComponentRepository = bomComponentRepository;
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

        if (product.getBomComponents() != null) {
            saveBomComponents(savedProduct, product.getBomComponents());
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

        if (productDetails.getBomComponents() != null) {
            saveBomComponents(updatedProduct, productDetails.getBomComponents());
        }

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

    private void saveBomComponents(Product product, List<com.minierp.backend.dto.BomDto.ComponentDto> componentsList) {
        if (componentsList == null) return;
        
        if (componentsList.isEmpty()) {
            // Delete Bom if exists
            List<Bom> existingBoms = bomRepository.findByFinishedProductId(product.getId());
            if (!existingBoms.isEmpty()) {
                Bom bom = existingBoms.get(0);
                List<BomComponent> components = bomComponentRepository.findByBomId(bom.getId());
                bomComponentRepository.deleteAll(components);
                bomRepository.delete(bom);
            }
            product.setBomId(null);
            product.setProcurementType(com.minierp.backend.model.ProcurementType.MANUFACTURING); // keep it Manufacturing or default back? Let's default to PURCHASE if empty
            product.setProcurementType(com.minierp.backend.model.ProcurementType.PURCHASE);
            productRepository.save(product);
            return;
        }

        // Set to MANUFACTURING
        product.setProcurementType(com.minierp.backend.model.ProcurementType.MANUFACTURING);

        // Find or create Bom
        List<Bom> existingBoms = bomRepository.findByFinishedProductId(product.getId());
        Bom bom;
        if (!existingBoms.isEmpty()) {
            bom = existingBoms.get(0);
            // Clear existing components
            List<BomComponent> existingComponents = bomComponentRepository.findByBomId(bom.getId());
            bomComponentRepository.deleteAll(existingComponents);
        } else {
            bom = Bom.builder()
                    .name(product.getName() + " BoM")
                    .finishedProduct(product)
                    .productQty(1)
                    .build();
            bom = bomRepository.save(bom);
        }

        // Save new components
        for (com.minierp.backend.dto.BomDto.ComponentDto compDto : componentsList) {
            if (compDto.getName() == null || compDto.getName().trim().isEmpty()) {
                continue;
            }
            Product componentProduct = productRepository.findByName(compDto.getName())
                    .orElse(null);
            if (componentProduct == null) {
                componentProduct = productRepository.findBySku(compDto.getName())
                        .orElse(null);
            }
            if (componentProduct == null) {
                String name = compDto.getName().trim();
                String sku = "RAW-" + name.toUpperCase().replaceAll("[^A-Z0-9]", "-");
                int suffix = 1;
                String baseSku = sku;
                while (productRepository.findBySku(sku).isPresent()) {
                    sku = baseSku + "-" + suffix++;
                }
                componentProduct = Product.builder()
                        .name(name)
                        .sku(sku)
                        .salesPrice(java.math.BigDecimal.ZERO)
                        .costPrice(java.math.BigDecimal.ZERO)
                        .onHandQty(0)
                        .reservedQty(0)
                        .procurementStrategy(ProcurementStrategy.MTS)
                        .procurementType(ProcurementType.PURCHASE)
                        .build();
                componentProduct = productRepository.save(componentProduct);
                
                String username = getCurrentUsername();
                AuditLog rawAudit = AuditLog.builder()
                        .username(username)
                        .action("AUTO_CREATE_RAW_MATERIAL")
                        .details(String.format("Automatically created raw material component '%s' (SKU: %s) during Product BoM setup.", name, sku))
                        .build();
                auditLogRepository.save(rawAudit);
            }
            BomComponent bomComponent = BomComponent.builder()
                    .bom(bom)
                    .component(componentProduct)
                    .quantity(compDto.getQty() != null ? compDto.getQty() : 1)
                    .build();
            bomComponentRepository.save(bomComponent);
        }

        // Update product's bomId
        product.setBomId(bom.getId());
        productRepository.save(product);
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
