package com.minierp.backend.controller;

import com.minierp.backend.model.Customer;
import com.minierp.backend.model.AuditLog;
import com.minierp.backend.repository.CustomerRepository;
import com.minierp.backend.repository.AuditLogRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final AuditLogRepository auditLogRepository;

    public CustomerController(CustomerRepository customerRepository, AuditLogRepository auditLogRepository) {
        this.customerRepository = customerRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        Customer savedCustomer = customerRepository.save(customer);
        
        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("CREATE_CUSTOMER")
                .details(String.format("Created customer ID %d: %s", savedCustomer.getId(), savedCustomer.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(savedCustomer);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @Valid @RequestBody Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + id));
        customer.setName(customerDetails.getName());
        customer.setPhone(customerDetails.getPhone());
        customer.setEmail(customerDetails.getEmail());
        customer.setAddress(customerDetails.getAddress());
        Customer updatedCustomer = customerRepository.save(customer);

        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("UPDATE_CUSTOMER")
                .details(String.format("Updated customer ID %d: %s", id, updatedCustomer.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(updatedCustomer);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + id));
        customerRepository.delete(customer);

        AuditLog auditLog = AuditLog.builder()
                .username(getCurrentUsername())
                .action("DELETE_CUSTOMER")
                .details(String.format("Deleted customer ID %d: %s", id, customer.getName()))
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.noContent().build();
    }

    private String getCurrentUsername() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        }
        return "SYSTEM";
    }
}
