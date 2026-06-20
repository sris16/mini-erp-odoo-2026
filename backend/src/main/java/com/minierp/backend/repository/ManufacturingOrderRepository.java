package com.minierp.backend.repository;

import com.minierp.backend.model.ManufacturingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ManufacturingOrderRepository extends JpaRepository<ManufacturingOrder, Long> {
    List<ManufacturingOrder> findAllByOrderByCreatedDateDesc();
}
