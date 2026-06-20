package com.minierp.backend.controller;

import com.minierp.backend.model.Customer;
import com.minierp.backend.repository.CustomerRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES_USER')")
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        return ResponseEntity.ok(customerRepository.save(customer));
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
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with id: " + id));
        customerRepository.delete(customer);
        return ResponseEntity.noContent().build();
    }
}
