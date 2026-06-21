package com.minierp.backend.service;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.time.LocalDateTime;

@Service
public class StockLedgerService {

    private final ProductRepository productRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final AuditLogRepository auditLogRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final LocationStockRepository locationStockRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ManufacturingOrderRepository manufacturingOrderRepository;
    private final BomComponentRepository bomComponentRepository;

    public StockLedgerService(ProductRepository productRepository,
                              StockLedgerRepository stockLedgerRepository,
                              AuditLogRepository auditLogRepository,
                              WarehouseLocationRepository warehouseLocationRepository,
                              LocationStockRepository locationStockRepository,
                              @org.springframework.context.annotation.Lazy SalesOrderRepository salesOrderRepository,
                              @org.springframework.context.annotation.Lazy ManufacturingOrderRepository manufacturingOrderRepository,
                              @org.springframework.context.annotation.Lazy BomComponentRepository bomComponentRepository) {
        this.productRepository = productRepository;
        this.stockLedgerRepository = stockLedgerRepository;
        this.auditLogRepository = auditLogRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.locationStockRepository = locationStockRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.manufacturingOrderRepository = manufacturingOrderRepository;
        this.bomComponentRepository = bomComponentRepository;
    }

    private WarehouseLocation getDefaultLocation() {
        return warehouseLocationRepository.findByCode("MAIN")
                .orElseGet(() -> warehouseLocationRepository.save(
                        WarehouseLocation.builder().name("Main Warehouse").code("MAIN").build()
                ));
    }

    @Transactional
    public void logMovement(Product product, int qtyChanged, StockMovementType type, String sourceDocument) {
        logMovement(product, qtyChanged, type, sourceDocument, null);
    }

    @Transactional
    public void logMovement(Product product, int qtyChanged, StockMovementType type, String sourceDocument, WarehouseLocation location) {
        if (qtyChanged <= 0) {
            throw new IllegalArgumentException("Quantity changed must be greater than zero");
        }

        final WarehouseLocation targetLocation = location != null ? location : getDefaultLocation();

        int previousStock = product.getOnHandQty();
        int newStock = previousStock;

        if (type == StockMovementType.IN) {
            newStock += qtyChanged;
        } else if (type == StockMovementType.OUT) {
            newStock -= qtyChanged;
        }

        product.setOnHandQty(newStock);
        productRepository.save(product);

        // Update LocationStock
        LocationStock locStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), targetLocation.getId())
                .orElseGet(() -> LocationStock.builder().product(product).location(targetLocation).onHandQty(0).reservedQty(0).build());
        
        int prevLocStock = locStock.getOnHandQty();
        if (type == StockMovementType.IN) {
            locStock.setOnHandQty(prevLocStock + qtyChanged);
        } else {
            locStock.setOnHandQty(Math.max(0, prevLocStock - qtyChanged));
        }
        locationStockRepository.save(locStock);

        StockLedger ledger = StockLedger.builder()
                .product(product)
                .location(targetLocation)
                .qtyChanged(qtyChanged)
                .type(type)
                .sourceDocument(sourceDocument)
                .build();
        stockLedgerRepository.save(ledger);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_MOVEMENT")
                .details(String.format("Product: %s (%s) stock changed from %d to %d (diff: %d, type: %s) at %s via %s",
                        product.getName(), product.getSku(), previousStock, newStock, qtyChanged, type, targetLocation.getName(), sourceDocument))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void reserveStock(Product product, int qtyToReserve) {
        reserveStock(product, qtyToReserve, null);
    }

    @Transactional
    public void reserveStock(Product product, int qtyToReserve, WarehouseLocation location) {
        if (qtyToReserve <= 0) {
            throw new IllegalArgumentException("Quantity to reserve must be greater than zero");
        }

        final WarehouseLocation targetLocation = location != null ? location : getDefaultLocation();

        int previousReserved = product.getReservedQty();
        int newReserved = previousReserved + qtyToReserve;
        product.setReservedQty(newReserved);
        productRepository.save(product);

        // Update LocationStock
        LocationStock locStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), targetLocation.getId())
                .orElseGet(() -> LocationStock.builder().product(product).location(targetLocation).onHandQty(0).reservedQty(0).build());
        locStock.setReservedQty(locStock.getReservedQty() + qtyToReserve);
        locationStockRepository.save(locStock);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_RESERVATION")
                .details(String.format("Reserved %d units of product %s (%s) at %s. Reserved qty changed from %d to %d",
                        qtyToReserve, product.getName(), product.getSku(), targetLocation.getName(), previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void releaseStock(Product product, int qtyToRelease) {
        releaseStock(product, qtyToRelease, null);
    }

    @Transactional
    public void releaseStock(Product product, int qtyToRelease, WarehouseLocation location) {
        if (qtyToRelease <= 0) {
            throw new IllegalArgumentException("Quantity to release must be greater than zero");
        }

        final WarehouseLocation targetLocation = location != null ? location : getDefaultLocation();

        int previousReserved = product.getReservedQty();
        int newReserved = Math.max(0, previousReserved - qtyToRelease);
        product.setReservedQty(newReserved);
        productRepository.save(product);

        // Update LocationStock
        LocationStock locStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), targetLocation.getId())
                .orElseGet(() -> LocationStock.builder().product(product).location(targetLocation).onHandQty(0).reservedQty(0).build());
        locStock.setReservedQty(Math.max(0, locStock.getReservedQty() - qtyToRelease));
        locationStockRepository.save(locStock);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_RESERVATION_RELEASE")
                .details(String.format("Released %d units of product %s (%s) at %s. Reserved qty changed from %d to %d",
                        qtyToRelease, product.getName(), product.getSku(), targetLocation.getName(), previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void executeDelivery(Product product, int qtyToDeliver, String sourceDocument) {
        executeDelivery(product, qtyToDeliver, sourceDocument, null);
    }

    @Transactional
    public void executeDelivery(Product product, int qtyToDeliver, String sourceDocument, WarehouseLocation location) {
        if (qtyToDeliver <= 0) {
            throw new IllegalArgumentException("Quantity to deliver must be greater than zero");
        }

        final WarehouseLocation targetLocation = location != null ? location : getDefaultLocation();

        int previousStock = product.getOnHandQty();
        int previousReserved = product.getReservedQty();

        int newStock = previousStock - qtyToDeliver;
        int newReserved = Math.max(0, previousReserved - qtyToDeliver);

        product.setOnHandQty(newStock);
        product.setReservedQty(newReserved);
        productRepository.save(product);

        // Update LocationStock
        LocationStock locStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), targetLocation.getId())
                .orElseGet(() -> LocationStock.builder().product(product).location(targetLocation).onHandQty(0).reservedQty(0).build());
        locStock.setOnHandQty(Math.max(0, locStock.getOnHandQty() - qtyToDeliver));
        locStock.setReservedQty(Math.max(0, locStock.getReservedQty() - qtyToDeliver));
        locationStockRepository.save(locStock);

        StockLedger ledger = StockLedger.builder()
                .product(product)
                .location(targetLocation)
                .qtyChanged(qtyToDeliver)
                .type(StockMovementType.OUT)
                .sourceDocument(sourceDocument)
                .build();
        stockLedgerRepository.save(ledger);

        String username = getCurrentUsername();
        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action("STOCK_DELIVERY")
                .details(String.format("Delivered %d units of product %s (%s) at %s via %s. OnHand: %d->%d, Reserved: %d->%d",
                        qtyToDeliver, product.getName(), product.getSku(), targetLocation.getName(), sourceDocument, previousStock, newStock, previousReserved, newReserved))
                .build();
        auditLogRepository.save(auditLog);
    }

    public List<StockLedger> getLedgerForProduct(Long productId) {
        return stockLedgerRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    public List<StockLedger> getAllLedger() {
        return stockLedgerRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public void runReservationScheduler() {
        // 1. Reset reservedQty for all products
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            product.setReservedQty(0);
        }
        productRepository.saveAll(products);

        // 2. Reset reservedQty for all LocationStock records
        List<LocationStock> locStocks = locationStockRepository.findAll();
        for (LocationStock ls : locStocks) {
            ls.setReservedQty(0);
        }
        locationStockRepository.saveAll(locStocks);

        // 3. Fetch all reservation demands from confirmed/partially completed transactions
        List<Demand> demands = new ArrayList<>();

        // 3.1. Fetch Sales Orders (CONFIRMED or PARTIALLY_DELIVERED)
        List<SalesOrder> salesOrders = salesOrderRepository.findAll().stream()
                .filter(so -> so.getStatus() == SalesOrderStatus.CONFIRMED || so.getStatus() == SalesOrderStatus.PARTIALLY_DELIVERED)
                .toList();
        for (SalesOrder so : salesOrders) {
            LocalDateTime date = so.getOrderDate() != null ? so.getOrderDate() : LocalDateTime.MIN;
            for (SalesOrderLine line : so.getLines()) {
                int remaining = line.getQtyOrdered() - (line.getQtyDelivered() != null ? line.getQtyDelivered() : 0);
                if (remaining > 0 && line.getProduct().getProcurementStrategy() == ProcurementStrategy.MTS) {
                    demands.add(new Demand(line.getProduct().getId(), remaining, date, "SO-" + so.getId()));
                }
            }
        }

        // 3.2. Fetch Manufacturing Orders (CONFIRMED or IN_PROGRESS)
        List<ManufacturingOrder> mfgOrders = manufacturingOrderRepository.findAll().stream()
                .filter(mo -> mo.getStatus() == ManufacturingOrderStatus.CONFIRMED || mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS)
                .toList();
        for (ManufacturingOrder mo : mfgOrders) {
            LocalDateTime date = mo.getCreatedDate() != null ? mo.getCreatedDate() : LocalDateTime.MIN;
            if (mo.getBom() != null) {
                List<BomComponent> components = bomComponentRepository.findByBomId(mo.getBom().getId());
                for (BomComponent comp : components) {
                    int totalQtyNeeded = comp.getQuantity() * mo.getQty();
                    demands.add(new Demand(comp.getComponent().getId(), totalQtyNeeded, date, "MO-" + mo.getId()));
                }
            }
        }

        // 4. Sort demands by date ascending (FIFO - First In, First Out)
        demands.sort(Comparator.comparing(Demand::getDate));

        // 5. Allocate reservations one-by-one
        WarehouseLocation defaultLoc = getDefaultLocation();
        for (Demand demand : demands) {
            Product product = productRepository.findById(demand.getProductId()).orElse(null);
            if (product == null) continue;

            int freeStock = product.getOnHandQty() - product.getReservedQty();
            int toReserve = Math.min(demand.getQtyNeeded(), Math.max(0, freeStock));

            if (toReserve > 0) {
                // Update Product
                product.setReservedQty(product.getReservedQty() + toReserve);
                productRepository.save(product);

                // Update LocationStock (at default MAIN location)
                LocationStock locStock = locationStockRepository.findByProductIdAndLocationId(product.getId(), defaultLoc.getId())
                        .orElseGet(() -> LocationStock.builder()
                                .product(product)
                                .location(defaultLoc)
                                .onHandQty(0)
                                .reservedQty(0)
                                .build());
                locStock.setReservedQty(locStock.getReservedQty() + toReserve);
                locationStockRepository.save(locStock);
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .username("SYSTEM")
                .action("RESERVATION_SCHEDULER")
                .details(String.format("Executed unified reservation scheduler. Re-apportioned reservations for %d pending demands.", demands.size()))
                .build();
        auditLogRepository.save(auditLog);
    }

    private static class Demand {
        private final Long productId;
        private final int qtyNeeded;
        private final LocalDateTime date;
        private final String source;

        public Demand(Long productId, int qtyNeeded, LocalDateTime date, String source) {
            this.productId = productId;
            this.qtyNeeded = qtyNeeded;
            this.date = date;
            this.source = source;
        }

        public Long getProductId() { return productId; }
        public int getQtyNeeded() { return qtyNeeded; }
        public LocalDateTime getDate() { return date; }
        public String getSource() { return source; }
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
