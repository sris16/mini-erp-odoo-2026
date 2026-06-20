package com.minierp.backend.repository;

import com.minierp.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByName(String name);
}
