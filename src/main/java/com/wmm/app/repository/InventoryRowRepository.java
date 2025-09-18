package com.wmm.app.repository;

import com.wmm.app.domain.InventoryRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRowRepository extends JpaRepository<InventoryRow, Long> {}
