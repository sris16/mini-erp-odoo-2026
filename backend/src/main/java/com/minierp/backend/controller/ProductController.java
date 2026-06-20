package com.minierp.backend.controller;

import com.minierp.backend.dto.StockAdjustmentRequest;
import com.minierp.backend.model.Product;
import com.minierp.backend.model.StockLedger;
import com.minierp.backend.service.ProductService;
import com.minierp.backend.service.StockLedgerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final StockLedgerService stockLedgerService;

    public ProductController(ProductService productService, StockLedgerService stockLedgerService) {
        this.productService = productService;
        this.stockLedgerService = stockLedgerService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/ledger")
    public ResponseEntity<List<StockLedger>> getAllLedger() {
        return ResponseEntity.ok(stockLedgerService.getAllLedger());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<Product> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(productService.getProductBySku(sku));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        return ResponseEntity.ok(product.getId() == null ? productService.createProduct(product) : productService.updateProduct(product.getId(), product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/adjust-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
    public ResponseEntity<Void> adjustStock(@PathVariable Long id, @Valid @RequestBody StockAdjustmentRequest request) {
        productService.adjustStock(id, request.getQtyChanged(), request.getType(), request.getReason());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/ledger")
    public ResponseEntity<List<StockLedger>> getProductLedger(@PathVariable Long id) {
        return ResponseEntity.ok(stockLedgerService.getLedgerForProduct(id));
    }
}
