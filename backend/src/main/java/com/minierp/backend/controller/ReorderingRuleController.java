package com.minierp.backend.controller;

import com.minierp.backend.model.Product;
import com.minierp.backend.model.ReorderingRule;
import com.minierp.backend.repository.ProductRepository;
import com.minierp.backend.repository.ReorderingRuleRepository;
import com.minierp.backend.service.ProcurementService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reordering-rules")
@PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
public class ReorderingRuleController {

    private final ReorderingRuleRepository reorderingRuleRepository;
    private final ProductRepository productRepository;
    private final ProcurementService procurementService;

    public ReorderingRuleController(ReorderingRuleRepository reorderingRuleRepository,
                                    ProductRepository productRepository,
                                    ProcurementService procurementService) {
        this.reorderingRuleRepository = reorderingRuleRepository;
        this.productRepository = productRepository;
        this.procurementService = procurementService;
    }

    @GetMapping
    public ResponseEntity<List<ReorderingRule>> getAllRules() {
        return ResponseEntity.ok(reorderingRuleRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createRule(@RequestBody ReorderingRuleRequest request) {
        if (request.getProductId() == null) {
            return ResponseEntity.badRequest().body("Product ID is required");
        }
        Product product = productRepository.findById(request.getProductId()).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body("Product not found");
        }

        // Check if rule already exists for this product
        if (reorderingRuleRepository.findByProductId(request.getProductId()).isPresent()) {
            return ResponseEntity.badRequest().body("Reordering rule already exists for this product");
        }

        ReorderingRule rule = ReorderingRule.builder()
                .product(product)
                .minQty(request.getMinQty())
                .maxQty(request.getMaxQty())
                .build();

        return ResponseEntity.ok(reorderingRuleRepository.save(rule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRule(@PathVariable Long id, @RequestBody ReorderingRuleRequest request) {
        ReorderingRule rule = reorderingRuleRepository.findById(id).orElse(null);
        if (rule == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.getMinQty() != null) {
            rule.setMinQty(request.getMinQty());
        }
        if (request.getMaxQty() != null) {
            rule.setMaxQty(request.getMaxQty());
        }

        return ResponseEntity.ok(reorderingRuleRepository.save(rule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        if (!reorderingRuleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reorderingRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/run")
    public ResponseEntity<String> runScheduler() {
        procurementService.runReorderingRules();
        return ResponseEntity.ok("Scheduler executed successfully");
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorderingRuleRequest {
        private Long productId;
        private Integer minQty;
        private Integer maxQty;
    }
}
