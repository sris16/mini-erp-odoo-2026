package com.minierp.backend.repository;

import com.minierp.backend.model.BomComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BomComponentRepository extends JpaRepository<BomComponent, Long> {
    List<BomComponent> findByBomId(Long bomId);
}
