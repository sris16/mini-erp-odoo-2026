package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManufacturingService {

    private final ManufacturingOrderRepository manufacturingOrderRepository;
    private final WorkOrderRepository workOrderRepository;
    private final BomComponentRepository bomComponentRepository;
    private final StockLedgerService stockLedgerService;
    private final ProcurementService procurementService;
    private final PurchaseOrderService purchaseOrderService;
    private final AuditLogRepository auditLogRepository;

    public ManufacturingService(ManufacturingOrderRepository manufacturingOrderRepository,
                                WorkOrderRepository workOrderRepository,
                                BomComponentRepository bomComponentRepository,
                                StockLedgerService stockLedgerService,
                                ProcurementService procurementService,
                                PurchaseOrderService purchaseOrderService,
                                AuditLogRepository auditLogRepository) {
        this.manufacturingOrderRepository = manufacturingOrderRepository;
        this.workOrderRepository = workOrderRepository;
        this.bomComponentRepository = bomComponentRepository;
        this.stockLedgerService = stockLedgerService;
        this.procurementService = procurementService;
        this.purchaseOrderService = purchaseOrderService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<ManufacturingOrder> getAllManufacturingOrders() {
        return manufacturingOrderRepository.findAllByOrderByCreatedDateDesc();
    }

    public ManufacturingOrder getManufacturingOrderById(Long id) {
        return manufacturingOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Manufacturing Order not found with id: " + id));
    }

    @Transactional
    public ManufacturingOrder createManufacturingOrder(ManufacturingOrder mo) {
        mo.setStatus(ManufacturingOrderStatus.DRAFT);
        mo.setCreatedDate(LocalDateTime.now());
        if (mo.getWorkOrders() != null) {
            for (WorkOrder wo : mo.getWorkOrders()) {
                wo.setManufacturingOrder(mo);
                wo.setStatus(WorkOrderStatus.READY);
            }
        }

        ManufacturingOrder savedMo = manufacturingOrderRepository.save(mo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CREATE_MANUFACTURING_ORDER")
                .details(String.format("Created Manufacturing Order ID %d for product %s in DRAFT status",
                        savedMo.getId(), savedMo.getFinishedProduct().getName()))
                .build();
        auditLogRepository.save(auditLog);

        return savedMo;
    }

    @Transactional
    public ManufacturingOrder confirmManufacturingOrder(Long id) {
        ManufacturingOrder mo = getManufacturingOrderById(id);

        if (mo.getStatus() != ManufacturingOrderStatus.DRAFT) {
            throw new IllegalStateException("Manufacturing Order is already " + mo.getStatus());
        }

        mo.setStatus(ManufacturingOrderStatus.CONFIRMED);

        String sourceDoc = "MO-" + id;

        // Reserve BoM components and trigger auto-procurement for component shortages
        if (mo.getBom() != null) {
            List<BomComponent> components = bomComponentRepository.findByBomId(mo.getBom().getId());
            for (BomComponent comp : components) {
                Product compProduct = comp.getComponent();
                int totalQtyNeeded = comp.getQuantity() * mo.getQty();

                int freeStock = compProduct.getOnHandQty() - compProduct.getReservedQty();
                int toReserve = Math.min(totalQtyNeeded, Math.max(0, freeStock));

                if (toReserve > 0) {
                    stockLedgerService.reserveStock(compProduct, toReserve);
                }

                int shortage = totalQtyNeeded - toReserve;
                if (shortage > 0) {
                    // Trigger auto-procurement for components (multi-level supply chain)
                    procurementService.autoProcure(compProduct, shortage, sourceDoc);
                }
            }
        }

        ManufacturingOrder confirmedMo = manufacturingOrderRepository.save(mo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CONFIRM_MANUFACTURING_ORDER")
                .details(String.format("Confirmed Manufacturing Order ID %d. Reserved components and triggered procurement for shortages.", id))
                .build();
        auditLogRepository.save(auditLog);

        return confirmedMo;
    }

    @Transactional
    public WorkOrder startWorkOrder(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found with id: " + workOrderId));

        wo.setStatus(WorkOrderStatus.IN_PROGRESS);

        ManufacturingOrder mo = wo.getManufacturingOrder();
        if (mo.getStatus() == ManufacturingOrderStatus.CONFIRMED) {
            mo.setStatus(ManufacturingOrderStatus.IN_PROGRESS);
            manufacturingOrderRepository.save(mo);
        }

        WorkOrder updatedWo = workOrderRepository.save(wo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("START_WORK_ORDER")
                .details(String.format("Started work order operation '%s' for MO ID %d", wo.getOperationName(), mo.getId()))
                .build();
        auditLogRepository.save(auditLog);

        return updatedWo;
    }

    @Transactional
    public WorkOrder completeWorkOrder(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found with id: " + workOrderId));

        wo.setStatus(WorkOrderStatus.DONE);

        ManufacturingOrder mo = wo.getManufacturingOrder();
        if (mo.getStatus() == ManufacturingOrderStatus.CONFIRMED) {
            mo.setStatus(ManufacturingOrderStatus.IN_PROGRESS);
            manufacturingOrderRepository.save(mo);
        }

        WorkOrder updatedWo = workOrderRepository.save(wo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("COMPLETE_WORK_ORDER")
                .details(String.format("Completed work order operation '%s' for MO ID %d", wo.getOperationName(), mo.getId()))
                .build();
        auditLogRepository.save(auditLog);

        return updatedWo;
    }

    @Transactional
    public ManufacturingOrder completeManufacturingOrder(Long id) {
        ManufacturingOrder mo = getManufacturingOrderById(id);

        if (mo.getStatus() != ManufacturingOrderStatus.CONFIRMED && mo.getStatus() != ManufacturingOrderStatus.IN_PROGRESS) {
            throw new IllegalStateException("Only CONFIRMED or IN_PROGRESS Manufacturing Orders can be completed");
        }

        // Verify that all work orders are completed (status = DONE)
        List<WorkOrder> workOrders = workOrderRepository.findByManufacturingOrderId(id);
        for (WorkOrder wo : workOrders) {
            if (wo.getStatus() != WorkOrderStatus.DONE) {
                throw new IllegalStateException(String.format("Cannot complete MO. Work order operation '%s' is not completed.",
                        wo.getOperationName()));
            }
        }

        String sourceDoc = "MO-" + id;

        // 1. Consume components (deduct from physical stock and release reservations)
        if (mo.getBom() != null) {
            List<BomComponent> components = bomComponentRepository.findByBomId(mo.getBom().getId());
            for (BomComponent comp : components) {
                Product compProduct = comp.getComponent();
                int totalQtyConsumed = comp.getQuantity() * mo.getQty();

                stockLedgerService.executeDelivery(compProduct, totalQtyConsumed, sourceDoc);
            }
        }

        // 2. Create finished goods (increment finished product stock)
        Product finishedProduct = mo.getFinishedProduct();
        int qtyProduced = mo.getQty();
        stockLedgerService.logMovement(finishedProduct, qtyProduced, StockMovementType.IN, sourceDoc);

        mo.setStatus(ManufacturingOrderStatus.DONE);
        ManufacturingOrder completedMo = manufacturingOrderRepository.save(mo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("COMPLETE_MANUFACTURING_ORDER")
                .details(String.format("Completed Manufacturing Order ID %d. Consumed components and produced %d units of %s.",
                        id, qtyProduced, finishedProduct.getName()))
                .build();
        auditLogRepository.save(auditLog);

        // 3. Trigger Scheduler Run: Reallocate reservations to confirmed Sales Orders
        purchaseOrderService.runReservationScheduler();

        return completedMo;
    }

    @Transactional
    public ManufacturingOrder cancelManufacturingOrder(Long id) {
        ManufacturingOrder mo = getManufacturingOrderById(id);

        if (mo.getStatus() == ManufacturingOrderStatus.DONE) {
            throw new IllegalStateException("Cannot cancel an already completed Manufacturing Order");
        }

        if (mo.getStatus() == ManufacturingOrderStatus.CANCELLED) {
            return mo;
        }

        // Release any reserved component stock
        if (mo.getStatus() == ManufacturingOrderStatus.CONFIRMED || mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS) {
            if (mo.getBom() != null) {
                List<BomComponent> components = bomComponentRepository.findByBomId(mo.getBom().getId());
                for (BomComponent comp : components) {
                    Product compProduct = comp.getComponent();
                    int totalQtyReserved = comp.getQuantity() * mo.getQty();
                    int toRelease = Math.min(totalQtyReserved, compProduct.getReservedQty());
                    if (toRelease > 0) {
                        stockLedgerService.releaseStock(compProduct, toRelease);
                    }
                }
            }
        }

        mo.setStatus(ManufacturingOrderStatus.CANCELLED);
        ManufacturingOrder cancelledMo = manufacturingOrderRepository.save(mo);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("CANCEL_MANUFACTURING_ORDER")
                .details(String.format("Cancelled Manufacturing Order ID %d and released component reservations.", id))
                .build();
        auditLogRepository.save(auditLog);

        return cancelledMo;
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
