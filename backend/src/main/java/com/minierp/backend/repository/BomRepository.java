package com.minierp.backend.repository;

import com.minierp.backend.model.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BomRepository extends JpaRepository<Bom, Long> {
    List<Bom> findByFinishedProductId(Long productId);
}
