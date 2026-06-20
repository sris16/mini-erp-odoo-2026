package com.minierp.backend.config;

import com.minierp.backend.model.*;
import com.minierp.backend.repository.*;
import com.minierp.backend.service.SalesOrderService;
import com.minierp.backend.service.StockLedgerService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WorkCenterRepository workCenterRepository;
    private final BomRepository bomRepository;
    private final BomComponentRepository bomComponentRepository;
    private final BomOperationRepository bomOperationRepository;
    private final PasswordEncoder passwordEncoder;
    private final StockLedgerService stockLedgerService;
    private final SalesOrderService salesOrderService;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;

    public DataSeeder(UserRepository userRepository,
                      ProductRepository productRepository,
                      WorkCenterRepository workCenterRepository,
                      BomRepository bomRepository,
                      BomComponentRepository bomComponentRepository,
                      BomOperationRepository bomOperationRepository,
                      PasswordEncoder passwordEncoder,
                      StockLedgerService stockLedgerService,
                      SalesOrderService salesOrderService,
                      CustomerRepository customerRepository,
                      VendorRepository vendorRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.workCenterRepository = workCenterRepository;
        this.bomRepository = bomRepository;
        this.bomComponentRepository = bomComponentRepository;
        this.bomOperationRepository = bomOperationRepository;
        this.passwordEncoder = passwordEncoder;
        this.stockLedgerService = stockLedgerService;
        this.salesOrderService = salesOrderService;
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (customerRepository.count() == 0) {
            seedCustomers();
        }
        if (vendorRepository.count() == 0) {
            seedVendors();
        }
        if (productRepository.count() == 0) {
            seedMasterDataAndTransactions();
        }
    }

    private void seedUsers() {
        userRepository.save(User.builder()
                .username("owner")
                .password(passwordEncoder.encode("owner123"))
                .role(Role.OWNER)
                .build());

        userRepository.save(User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build());

        userRepository.save(User.builder()
                .username("sales")
                .password(passwordEncoder.encode("sales123"))
                .role(Role.SALES_USER)
                .build());

        userRepository.save(User.builder()
                .username("purchase")
                .password(passwordEncoder.encode("purchase123"))
                .role(Role.PURCHASE_USER)
                .build());

        userRepository.save(User.builder()
                .username("mfg")
                .password(passwordEncoder.encode("mfg123"))
                .role(Role.MANUFACTURING_USER)
                .build());

        userRepository.save(User.builder()
                .username("inventory")
                .password(passwordEncoder.encode("inventory123"))
                .role(Role.INVENTORY_MANAGER)
                .build());

        System.out.println(">>> Seeded default users successfully: owner/owner123, admin/admin123, sales/sales123, purchase/purchase123, mfg/mfg123, inventory/inventory123");
    }

    private void seedMasterDataAndTransactions() {
        System.out.println(">>> Seeding Master Data...");

        // 1. Seed Work Centers
        WorkCenter cutting = workCenterRepository.save(WorkCenter.builder().name("Cutting Station").capacity(2).build());
        WorkCenter assembly = workCenterRepository.save(WorkCenter.builder().name("Assembly Station").capacity(3).build());
        WorkCenter upholstery = workCenterRepository.save(WorkCenter.builder().name("Upholstery Station").capacity(2).build());

        // 2. Seed Raw Materials (MTS, Purchase)
        Product wood = productRepository.save(Product.builder()
                .name("Oak Wood Log")
                .sku("RM-WOOD")
                .onHandQty(0) // seeded via ledger
                .reservedQty(0)
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.valueOf(50.00))
                .procurementStrategy(ProcurementStrategy.MTS)
                .procurementType(ProcurementType.PURCHASE)
                .vendor("Forest Timber Co")
                .build());

        Product metal = productRepository.save(Product.builder()
                .name("Steel Support Frame")
                .sku("RM-METAL")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.valueOf(120.00))
                .procurementStrategy(ProcurementStrategy.MTS)
                .procurementType(ProcurementType.PURCHASE)
                .vendor("Steel Works Ltd")
                .build());

        Product fabric = productRepository.save(Product.builder()
                .name("Velvet Upholstery Fabric (Meter)")
                .sku("RM-FABRIC")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.valueOf(80.00))
                .procurementStrategy(ProcurementStrategy.MTS)
                .procurementType(ProcurementType.PURCHASE)
                .vendor("Sofa Textures Inc")
                .build());

        Product foam = productRepository.save(Product.builder()
                .name("High Density Foam Block")
                .sku("RM-FOAM")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.valueOf(40.00))
                .procurementStrategy(ProcurementStrategy.MTS)
                .procurementType(ProcurementType.PURCHASE)
                .vendor("PolyFoam Corp")
                .build());

        Product screw = productRepository.save(Product.builder()
                .name("Industrial Screw Box (100pcs)")
                .sku("RM-SCREW")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.ZERO)
                .costPrice(BigDecimal.valueOf(15.00))
                .procurementStrategy(ProcurementStrategy.MTS)
                .procurementType(ProcurementType.PURCHASE)
                .vendor("Fasteners Direct")
                .build());

        // 3. Seed Finished Goods (MTO, Manufacturing)
        Product chair = productRepository.save(Product.builder()
                .name("Classic Dining Chair")
                .sku("FG-CHAIR")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.valueOf(250.00))
                .costPrice(BigDecimal.valueOf(120.00))
                .procurementStrategy(ProcurementStrategy.MTO)
                .procurementType(ProcurementType.MANUFACTURING)
                .build());

        Product table = productRepository.save(Product.builder()
                .name("Wooden Dining Table")
                .sku("FG-TABLE")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.valueOf(800.00))
                .costPrice(BigDecimal.valueOf(300.00))
                .procurementStrategy(ProcurementStrategy.MTO)
                .procurementType(ProcurementType.MANUFACTURING)
                .build());

        Product sofa = productRepository.save(Product.builder()
                .name("Luxury Sofa")
                .sku("FG-SOFA")
                .onHandQty(0)
                .reservedQty(0)
                .salesPrice(BigDecimal.valueOf(1200.00))
                .costPrice(BigDecimal.valueOf(500.00))
                .procurementStrategy(ProcurementStrategy.MTO)
                .procurementType(ProcurementType.MANUFACTURING)
                .build());

        // 4. Log initial stock for raw materials using StockLedger
        stockLedgerService.logMovement(wood, 150, StockMovementType.IN, "Initial Stock Seed");
        stockLedgerService.logMovement(metal, 50, StockMovementType.IN, "Initial Stock Seed");
        stockLedgerService.logMovement(fabric, 80, StockMovementType.IN, "Initial Stock Seed");
        stockLedgerService.logMovement(foam, 60, StockMovementType.IN, "Initial Stock Seed");
        stockLedgerService.logMovement(screw, 200, StockMovementType.IN, "Initial Stock Seed");

        // 5. Seed Bills of Materials (BoM)
        // A. Classic Chair BoM
        Bom bomChair = bomRepository.save(Bom.builder().name("Classic Chair BoM").finishedProduct(chair).productQty(1).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomChair).component(wood).quantity(2).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomChair).component(screw).quantity(8).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomChair).name("Wood Cutting & Shaping").durationMinutes(10).workCenter(cutting).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomChair).name("Structure Assembly").durationMinutes(15).workCenter(assembly).build());
        chair.setBomId(bomChair.getId());
        productRepository.save(chair);

        // B. Wooden Dining Table BoM
        Bom bomTable = bomRepository.save(Bom.builder().name("Wooden Table BoM").finishedProduct(table).productQty(1).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomTable).component(wood).quantity(6).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomTable).component(screw).quantity(16).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomTable).name("Tabletop Milling").durationMinutes(15).workCenter(cutting).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomTable).name("Leg attachment & Sanding").durationMinutes(20).workCenter(assembly).build());
        table.setBomId(bomTable.getId());
        productRepository.save(table);

        // C. Luxury Sofa BoM
        Bom bomSofa = bomRepository.save(Bom.builder().name("Luxury Sofa BoM").finishedProduct(sofa).productQty(1).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomSofa).component(wood).quantity(4).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomSofa).component(metal).quantity(1).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomSofa).component(fabric).quantity(5).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomSofa).component(foam).quantity(2).build());
        bomComponentRepository.save(BomComponent.builder().bom(bomSofa).component(screw).quantity(24).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomSofa).name("Frame Fabrication").durationMinutes(20).workCenter(assembly).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomSofa).name("Fabric Cutting").durationMinutes(15).workCenter(cutting).build());
        bomOperationRepository.save(BomOperation.builder().bom(bomSofa).name("Foam Stuffing & Upholstering").durationMinutes(45).workCenter(upholstery).build());
        sofa.setBomId(bomSofa.getId());
        productRepository.save(sofa);

        System.out.println(">>> Seeded all products, BoMs, components, and operations.");

        // 6. Seed Demo Transactions (Sales Orders)
        // SO-1: Draft SO for dining set
        SalesOrder so1 = SalesOrder.builder()
                .customerName("Grand Plaza Hotel")
                .status(SalesOrderStatus.DRAFT)
                .orderDate(LocalDateTime.now().minusDays(2))
                .lines(new ArrayList<>())
                .build();
        
        so1.getLines().add(SalesOrderLine.builder().salesOrder(so1).product(table).qtyOrdered(2).qtyDelivered(0).unitPrice(BigDecimal.valueOf(800.00)).build());
        so1.getLines().add(SalesOrderLine.builder().salesOrder(so1).product(chair).qtyOrdered(8).qtyDelivered(0).unitPrice(BigDecimal.valueOf(250.00)).build());
        
        salesOrderService.createSalesOrder(so1);

        // SO-2: Confirmed SO for a sofa (MTO rule will trigger dynamic draft MO creation!)
        SalesOrder so2 = SalesOrder.builder()
                .customerName("Royal Furnishings")
                .status(SalesOrderStatus.DRAFT)
                .orderDate(LocalDateTime.now().minusDays(1))
                .lines(new ArrayList<>())
                .build();

        so2.getLines().add(SalesOrderLine.builder().salesOrder(so2).product(sofa).qtyOrdered(2).qtyDelivered(0).unitPrice(BigDecimal.valueOf(1200.00)).build());
        
        SalesOrder savedSo2 = salesOrderService.createSalesOrder(so2);
        
        // Dynamically confirm to trigger MTO auto-procurement engine
        salesOrderService.confirmSalesOrder(savedSo2.getId());

        System.out.println(">>> Demo transactions seeded successfully. Confirmed SO-2 triggered draft MO dynamic generation.");
    }

    private void seedCustomers() {
        customerRepository.save(Customer.builder()
                .name("John Doe")
                .phone("+1 555-0199")
                .email("john@example.com")
                .address("123 Timber Lane, Oregon")
                .build());
        customerRepository.save(Customer.builder()
                .name("Jane Smith")
                .phone("+1 555-0144")
                .email("jane@example.com")
                .address("456 Forest Road, Seattle")
                .build());
        System.out.println(">>> Seeded default customers.");
    }

    private void seedVendors() {
        vendorRepository.save(Vendor.builder()
                .name("Oakland Lumber Supplies")
                .phone("+1 800-LUMBER")
                .email("sales@oaklandlumber.com")
                .address("789 Redwood Blvd, California")
                .build());
        vendorRepository.save(Vendor.builder()
                .name("Fastener Depot")
                .phone("+1 800-SCREWS")
                .email("info@fastenerdepot.com")
                .address("321 Hardware Ave, Ohio")
                .build());
        System.out.println(">>> Seeded default vendors.");
    }
}
