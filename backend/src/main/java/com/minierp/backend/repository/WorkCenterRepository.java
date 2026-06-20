package com.minierp.backend.repository;

import com.minierp.backend.model.WorkCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WorkCenterRepository extends JpaRepository<WorkCenter, Long> {
    Optional<WorkCenter> findByName(String name);
}
