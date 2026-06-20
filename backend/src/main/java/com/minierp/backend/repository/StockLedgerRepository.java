package com.minierp.backend.repository;

import com.minierp.backend.model.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {
    List<StockLedger> findByProductIdOrderByTimestampDesc(Long productId);
    List<StockLedger> findAllByOrderByTimestampDesc();
}
