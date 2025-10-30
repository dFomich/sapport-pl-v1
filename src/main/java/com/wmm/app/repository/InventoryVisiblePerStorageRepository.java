package com.wmm.app.repository;

import com.wmm.app.domain.InventoryVisiblePerStorage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryVisiblePerStorageRepository extends JpaRepository<InventoryVisiblePerStorage, Long> {
    Optional<InventoryVisiblePerStorage> findByStorageTypeAndMaterial(String storageType, String material);

    List<InventoryVisiblePerStorage> findByMaterial(String material);

    List<InventoryVisiblePerStorage> findByStorageType(String storageType);

    void deleteByStorageTypeAndMaterial(String storageType, String material);
}
