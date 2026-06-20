package com.minierp.backend.repository;

import com.minierp.backend.model.ReorderingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReorderingRuleRepository extends JpaRepository<ReorderingRule, Long> {
    Optional<ReorderingRule> findByProductId(Long productId);
}
