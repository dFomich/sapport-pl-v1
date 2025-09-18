package com.wmm.app.repository;

import com.wmm.app.domain.InventoryUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryUploadRepository extends JpaRepository<InventoryUpload, Long> {}
