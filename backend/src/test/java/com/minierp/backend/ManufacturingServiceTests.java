package com.minierp.backend;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import com.minierp.backend.service.ManufacturingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ManufacturingServiceTests {

    @Autowired
    private ManufacturingService manufacturingService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WorkCenterRepository workCenterRepository;

    @Autowired
    private ManufacturingOrderRepository manufacturingOrderRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Test
    void testCompleteManufacturingOrderUpdatesCostPrice() {
        // Create Finished Product
        Product chair = productRepository.save(Product.builder()
                .name("Test Chair")
                .sku("TEST-CHAIR")
                .salesPrice(new BigDecimal("100.00"))
                .costPrice(BigDecimal.ZERO)
                .onHandQty(0)
                .reservedQty(0)
                .build());

        // Create Work Center
        WorkCenter workCenter = workCenterRepository.save(WorkCenter.builder()
                .name("Test Assembly Center")
                .capacity(1)
                .laborCostPerHour(new BigDecimal("20.00"))
                .overheadCostPerHour(new BigDecimal("10.00"))
                .build());

        // Create MO
        ManufacturingOrder mo = ManufacturingOrder.builder()
                .finishedProduct(chair)
                .qty(2)
                .status(ManufacturingOrderStatus.DRAFT)
                .build();
        mo = manufacturingService.createManufacturingOrder(mo);

        // Add a mock Work Order
        WorkOrder wo = WorkOrder.builder()
                .manufacturingOrder(mo)
                .operationName("Assembly")
                .workCenter(workCenter)
                .durationMinutes(30) // total duration
                .status(WorkOrderStatus.READY)
                .build();
        wo = workOrderRepository.save(wo);
        mo.getWorkOrders().add(wo);
        mo = manufacturingOrderRepository.save(mo);

        // Confirm MO
        mo = manufacturingService.confirmManufacturingOrder(mo.getId());

        // Complete Work Order
        manufacturingService.startWorkOrder(wo.getId());
        manufacturingService.completeWorkOrder(wo.getId());

        // Complete MO
        mo = manufacturingService.completeManufacturingOrder(mo.getId());

        // Component cost = 0 (no bom component in test)
        // Operation cost = (30/60) hours * ($20 + $10) = 0.5 * 30 = $15.00
        // Expected unit cost = $15.00 / 2 units = $7.50
        Product updatedChair = productRepository.findById(chair.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("7.50").compareTo(updatedChair.getCostPrice()));
        assertEquals(ManufacturingOrderStatus.DONE, mo.getStatus());
    }
}
