package com.minierp.backend.repository;

import com.minierp.backend.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    List<SalesOrder> findAllByOrderByOrderDateDesc();
    List<SalesOrder> findAllByOrderByOrderDateAsc();
}
