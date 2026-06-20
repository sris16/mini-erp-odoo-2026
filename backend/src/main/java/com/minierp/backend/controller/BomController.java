package com.minierp.backend.controller;

import com.minierp.backend.dto.BomDto;
import com.minierp.backend.model.Bom;
import com.minierp.backend.model.BomComponent;
import com.minierp.backend.model.Product;
import com.minierp.backend.repository.BomComponentRepository;
import com.minierp.backend.repository.BomRepository;
import com.minierp.backend.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/bom")
public class BomController {

    private final BomRepository bomRepository;
    private final BomComponentRepository bomComponentRepository;
    private final ProductRepository productRepository;

    public BomController(BomRepository bomRepository,
                         BomComponentRepository bomComponentRepository,
                         ProductRepository productRepository) {
        this.bomRepository = bomRepository;
        this.bomComponentRepository = bomComponentRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ResponseEntity<List<BomDto>> getAllBoms() {
        List<Bom> boms = bomRepository.findAll();
        List<BomDto> dtos = boms.stream().map(bom -> {
            List<BomComponent> components = bomComponentRepository.findByBomId(bom.getId());
            List<BomDto.ComponentDto> componentDtos = components.stream().map(c -> 
                BomDto.ComponentDto.builder()
                        .name(c.getComponent().getName())
                        .qty(c.getQuantity())
                        .build()
            ).collect(Collectors.toList());

            return BomDto.builder()
                    .id(bom.getId())
                    .finishedProductName(bom.getFinishedProduct().getName())
                    .finishedProductId(bom.getFinishedProduct().getId())
                    .components(componentDtos)
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY_MANAGER')")
    @Transactional
    public ResponseEntity<BomDto> createBom(@RequestBody BomDto request) {
        Product finishedProduct = productRepository.findByName(request.getFinishedProductName())
                .orElseThrow(() -> new IllegalArgumentException("Finished product not found: " + request.getFinishedProductName()));

        Bom bom = Bom.builder()
                .name(finishedProduct.getName() + " BoM")
                .finishedProduct(finishedProduct)
                .productQty(1)
                .build();
        bom = bomRepository.save(bom);

        List<BomDto.ComponentDto> savedComponents = new ArrayList<>();
        for (BomDto.ComponentDto cDto : request.getComponents()) {
            Product compProduct = productRepository.findByName(cDto.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Component product not found: " + cDto.getName()));

            BomComponent comp = BomComponent.builder()
                    .bom(bom)
                    .component(compProduct)
                    .quantity(cDto.getQty())
                    .build();
            bomComponentRepository.save(comp);
            savedComponents.add(cDto);
        }

        // update product's bom link
        finishedProduct.setBomId(bom.getId());
        productRepository.save(finishedProduct);

        BomDto response = BomDto.builder()
                .id(bom.getId())
                .finishedProductName(finishedProduct.getName())
                .finishedProductId(finishedProduct.getId())
                .components(savedComponents)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Transactional
    public ResponseEntity<Void> deleteBom(@PathVariable Long id) {
        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("BoM not found: " + id));

        // clear product reference
        Product finishedProduct = bom.getFinishedProduct();
        if (finishedProduct != null && id.equals(finishedProduct.getBomId())) {
            finishedProduct.setBomId(null);
            productRepository.save(finishedProduct);
        }

        List<BomComponent> components = bomComponentRepository.findByBomId(id);
        bomComponentRepository.deleteAll(components);
        bomRepository.delete(bom);

        return ResponseEntity.noContent().build();
    }
}
