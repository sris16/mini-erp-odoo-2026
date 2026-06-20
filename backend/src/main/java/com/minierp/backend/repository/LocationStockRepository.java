package com.minierp.backend.repository;

import com.minierp.backend.model.LocationStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationStockRepository extends JpaRepository<LocationStock, Long> {
    Optional<LocationStock> findByProductIdAndLocationId(Long productId, Long locationId);
    List<LocationStock> findByLocationId(Long locationId);
    List<LocationStock> findByProductId(Long productId);
}
