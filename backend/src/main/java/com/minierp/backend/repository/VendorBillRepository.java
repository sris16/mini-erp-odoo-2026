package com.minierp.backend.repository;

import com.minierp.backend.model.VendorBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VendorBillRepository extends JpaRepository<VendorBill, Long> {
    List<VendorBill> findAllByOrderByIssueDateDesc();
}
