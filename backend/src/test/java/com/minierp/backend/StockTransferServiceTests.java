package com.minierp.backend;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import com.minierp.backend.service.StockLedgerService;
import com.minierp.backend.service.StockTransferService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class StockTransferServiceTests {

    @Autowired
    private StockTransferService stockTransferService;

    @Autowired
    private StockLedgerService stockLedgerService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseLocationRepository warehouseLocationRepository;

    @Autowired
    private LocationStockRepository locationStockRepository;

    @Autowired
    private StockTransferRepository stockTransferRepository;

    @Test
    void testStockTransferSuccess() {
        // Setup Product
        Product wood = productRepository.save(Product.builder()
                .name("Oak Wood Log Test")
                .sku("TEST-WOOD")
                .salesPrice(BigDecimal.ZERO)
                .costPrice(new BigDecimal("10.00"))
                .onHandQty(0)
                .reservedQty(0)
                .build());

        // Setup Locations
        WarehouseLocation mainLoc = warehouseLocationRepository.save(WarehouseLocation.builder()
                .name("Main Wh Test")
                .code("T-MAIN")
                .build());

        WarehouseLocation rmsLoc = warehouseLocationRepository.save(WarehouseLocation.builder()
                .name("Raw Material Shed Test")
                .code("T-RMS")
                .build());

        // Seed stock to MAIN location
        stockLedgerService.logMovement(wood, 100, StockMovementType.IN, "Initial Seed Test", mainLoc);

        // Validate initial location stock
        LocationStock mainStock = locationStockRepository.findByProductIdAndLocationId(wood.getId(), mainLoc.getId()).orElseThrow();
        assertEquals(100, mainStock.getOnHandQty());
        assertEquals(100, wood.getOnHandQty());

        // Create Stock Transfer
        StockTransfer transfer = StockTransfer.builder()
                .product(wood)
                .qty(30)
                .sourceLocation(mainLoc)
                .destinationLocation(rmsLoc)
                .build();
        
        transfer = stockTransferService.createTransfer(transfer);
        assertNotNull(transfer.getId());
        assertEquals("DRAFT", transfer.getStatus());
        assertNotNull(transfer.getTransferNumber());

        // Complete Stock Transfer
        transfer = stockTransferService.completeTransfer(transfer.getId());
        assertEquals("COMPLETED", transfer.getStatus());

        // Verify Location Stocks
        LocationStock updatedMainStock = locationStockRepository.findByProductIdAndLocationId(wood.getId(), mainLoc.getId()).orElseThrow();
        LocationStock updatedRmsStock = locationStockRepository.findByProductIdAndLocationId(wood.getId(), rmsLoc.getId()).orElseThrow();

        assertEquals(70, updatedMainStock.getOnHandQty());
        assertEquals(30, updatedRmsStock.getOnHandQty());

        // Verify global Product count is still 100
        Product updatedWood = productRepository.findById(wood.getId()).orElseThrow();
        assertEquals(100, updatedWood.getOnHandQty());
    }

    @Test
    void testStockTransferFailsSameLocations() {
        Product wood = productRepository.save(Product.builder()
                .name("Wood Test Same")
                .sku("TEST-WOOD-SAME")
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.TEN)
                .onHandQty(0)
                .build());

        WarehouseLocation mainLoc = warehouseLocationRepository.save(WarehouseLocation.builder()
                .name("Main Wh Test Same")
                .code("T-MAIN-SAME")
                .build());

        StockTransfer transfer = StockTransfer.builder()
                .product(wood)
                .qty(10)
                .sourceLocation(mainLoc)
                .destinationLocation(mainLoc)
                .build();

        assertThrows(IllegalArgumentException.class, () -> {
            stockTransferService.createTransfer(transfer);
        });
    }

    @Test
    void testStockTransferFailsInsufficientStock() {
        Product wood = productRepository.save(Product.builder()
                .name("Wood Test Insufficient")
                .sku("TEST-WOOD-INSUF")
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.TEN)
                .onHandQty(0)
                .build());

        WarehouseLocation mainLoc = warehouseLocationRepository.save(WarehouseLocation.builder()
                .name("Main Wh Test Insuf")
                .code("T-MAIN-INSUF")
                .build());

        WarehouseLocation rmsLoc = warehouseLocationRepository.save(WarehouseLocation.builder()
                .name("Raw Material Shed Test Insuf")
                .code("T-RMS-INSUF")
                .build());

        stockLedgerService.logMovement(wood, 10, StockMovementType.IN, "Initial Seed Test", mainLoc);

        StockTransfer transfer = StockTransfer.builder()
                .product(wood)
                .qty(20) // More than 10 available
                .sourceLocation(mainLoc)
                .destinationLocation(rmsLoc)
                .build();

        transfer = stockTransferService.createTransfer(transfer);
        final Long transferId = transfer.getId();

        assertThrows(IllegalArgumentException.class, () -> {
            stockTransferService.completeTransfer(transferId);
        });
    }
}
