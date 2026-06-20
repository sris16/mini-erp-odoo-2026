package com.minierp.backend.repository;

import com.minierp.backend.model.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, Long> {
    Optional<WarehouseLocation> findByCode(String code);
}
