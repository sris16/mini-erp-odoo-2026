package com.minierp.backend.repository;

import com.minierp.backend.model.BomOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BomOperationRepository extends JpaRepository<BomOperation, Long> {
    List<BomOperation> findByBomId(Long bomId);
}
