package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProcurementService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ManufacturingOrderRepository manufacturingOrderRepository;
    private final BomRepository bomRepository;
    private final BomOperationRepository bomOperationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ReorderingRuleRepository reorderingRuleRepository;

    public ProcurementService(PurchaseOrderRepository purchaseOrderRepository,
                              ManufacturingOrderRepository manufacturingOrderRepository,
                              BomRepository bomRepository,
                              BomOperationRepository bomOperationRepository,
                              AuditLogRepository auditLogRepository,
                              ReorderingRuleRepository reorderingRuleRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.manufacturingOrderRepository = manufacturingOrderRepository;
        this.bomRepository = bomRepository;
        this.bomOperationRepository = bomOperationRepository;
        this.auditLogRepository = auditLogRepository;
        this.reorderingRuleRepository = reorderingRuleRepository;
    }

    @Transactional
    public void autoProcure(Product product, int quantity, String sourceDocument) {
        if (product.getProcurementType() == ProcurementType.PURCHASE) {
            triggerAutoPurchase(product, quantity, sourceDocument);
        } else if (product.getProcurementType() == ProcurementType.MANUFACTURING) {
            triggerAutoManufacturing(product, quantity, sourceDocument);
        }
    }

    private void triggerAutoPurchase(Product product, int quantity, String sourceDocument) {
        String vendor = product.getVendor() != null && !product.getVendor().trim().isEmpty()
                ? product.getVendor()
                : "Default Vendor";

        // Find existing DRAFT Purchase Order for this vendor to consolidate
        List<PurchaseOrder> draftPOs = purchaseOrderRepository.findAllByOrderByOrderDateDesc().stream()
                .filter(po -> po.getVendorName().equalsIgnoreCase(vendor) && po.getStatus() == PurchaseOrderStatus.DRAFT)
                .toList();

        PurchaseOrder po;
        if (!draftPOs.isEmpty()) {
            po = draftPOs.get(0);
        } else {
            po = PurchaseOrder.builder()
                    .vendorName(vendor)
                    .status(PurchaseOrderStatus.DRAFT)
                    .orderDate(LocalDateTime.now())
                    .lines(new ArrayList<>())
                    .build();
        }

        // Check if product is already in the PO lines
        PurchaseOrderLine existingLine = po.getLines().stream()
                .filter(line -> line.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        if (existingLine != null) {
            existingLine.setQtyOrdered(existingLine.getQtyOrdered() + quantity);
        } else {
            PurchaseOrderLine newLine = PurchaseOrderLine.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .qtyOrdered(quantity)
                    .qtyReceived(0)
                    .unitPrice(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
                    .build();
            po.getLines().add(newLine);
        }

        purchaseOrderRepository.save(po);

        AuditLog auditLog = AuditLog.builder()
                .username("SYSTEM")
                .action("AUTO_PROCUREMENT_PO")
                .details(String.format("Auto-generated DRAFT PO ID %d for vendor %s. Added %d units of product %s (%s) triggered by %s",
                        po.getId(), vendor, quantity, product.getName(), product.getSku(), sourceDocument))
                .build();
        auditLogRepository.save(auditLog);
    }

    private void triggerAutoManufacturing(Product product, int quantity, String sourceDocument) {
        // Resolve BoM
        Bom bom = null;
        if (product.getBomId() != null) {
            bom = bomRepository.findById(product.getBomId()).orElse(null);
        }
        if (bom == null) {
            List<Bom> boms = bomRepository.findByFinishedProductId(product.getId());
            if (!boms.isEmpty()) {
                bom = boms.get(0);
            }
        }

        if (bom == null) {
            // Cannot manufacture without a BoM, log a warning audit log and return
            AuditLog auditLog = AuditLog.builder()
                    .username("SYSTEM")
                    .action("AUTO_PROCUREMENT_MO_FAILED")
                    .details(String.format("Auto-procurement failed for manufactured product %s (%s): No Bill of Materials (BoM) found! Source: %s",
                            product.getName(), product.getSku(), sourceDocument))
                    .build();
            auditLogRepository.save(auditLog);
            return;
        }

        // Create draft Manufacturing Order
        ManufacturingOrder mo = ManufacturingOrder.builder()
                .finishedProduct(product)
                .qty(quantity)
                .status(ManufacturingOrderStatus.DRAFT)
                .bom(bom)
                .createdDate(LocalDateTime.now())
                .workOrders(new ArrayList<>())
                .build();

        // Populate Work Orders from BoM Operations
        List<BomOperation> operations = bomOperationRepository.findByBomId(bom.getId());
        for (BomOperation op : operations) {
            WorkOrder wo = WorkOrder.builder()
                    .manufacturingOrder(mo)
                    .operationName(op.getName())
                    .workCenter(op.getWorkCenter())
                    .durationMinutes(op.getDurationMinutes() * quantity) // Time scales with quantity
                    .status(WorkOrderStatus.READY)
                    .build();
            mo.getWorkOrders().add(wo);
        }

        manufacturingOrderRepository.save(mo);

        AuditLog auditLog = AuditLog.builder()
                .username("SYSTEM")
                .action("AUTO_PROCUREMENT_MO")
                .details(String.format("Auto-generated DRAFT MO ID %d for product %s (%s) with %d work orders based on BoM ID %d. Triggered by %s",
                        mo.getId(), product.getName(), product.getSku(), mo.getWorkOrders().size(), bom.getId(), sourceDocument))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void runReorderingRules() {
        List<ReorderingRule> rules = reorderingRuleRepository.findAll();
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findAll();
        List<ManufacturingOrder> manufacturingOrders = manufacturingOrderRepository.findAll();

        for (ReorderingRule rule : rules) {
            Product product = rule.getProduct();
            if (product == null) continue;

            int onHand = product.getOnHandQty() != null ? product.getOnHandQty() : 0;
            int reserved = product.getReservedQty() != null ? product.getReservedQty() : 0;

            // Calculate pending incoming stock from CONFIRMED/PARTIALLY_RECEIVED POs
            int pendingIncomingPO = 0;
            for (PurchaseOrder po : purchaseOrders) {
                if (po.getStatus() == PurchaseOrderStatus.CONFIRMED || po.getStatus() == PurchaseOrderStatus.PARTIALLY_RECEIVED) {
                    for (PurchaseOrderLine line : po.getLines()) {
                        if (line.getProduct().getId().equals(product.getId())) {
                            int ordered = line.getQtyOrdered() != null ? line.getQtyOrdered() : 0;
                            int received = line.getQtyReceived() != null ? line.getQtyReceived() : 0;
                            pendingIncomingPO += Math.max(0, ordered - received);
                        }
                    }
                }
            }

            // Calculate pending incoming stock from CONFIRMED/IN_PROGRESS MOs
            int pendingIncomingMO = 0;
            for (ManufacturingOrder mo : manufacturingOrders) {
                if (mo.getStatus() == ManufacturingOrderStatus.CONFIRMED || mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS) {
                    if (mo.getFinishedProduct().getId().equals(product.getId())) {
                        pendingIncomingMO += mo.getQty() != null ? mo.getQty() : 0;
                    }
                }
            }

            int forecasted = onHand + pendingIncomingPO + pendingIncomingMO - reserved;

            if (forecasted < rule.getMinQty()) {
                int qtyToProcure = rule.getMaxQty() - forecasted;
                if (qtyToProcure > 0) {
                    autoProcure(product, qtyToProcure, "Reordering Rule ID: " + rule.getId());
                    rule.setLastTriggered(LocalDateTime.now());
                    reorderingRuleRepository.save(rule);
                }
            }
        }
    }
}
