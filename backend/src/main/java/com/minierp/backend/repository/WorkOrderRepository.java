package com.minierp.backend.repository;

import com.minierp.backend.model.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByManufacturingOrderId(Long moId);
}
