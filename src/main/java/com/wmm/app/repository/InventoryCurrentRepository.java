package com.wmm.app.repository;

import com.wmm.app.domain.InventoryCurrent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryCurrentRepository extends JpaRepository<InventoryCurrent, Long> {
    Optional<InventoryCurrent> findByStorageTypeAndMaterial(String storageType, String material);
    Page<InventoryCurrent> findAllByStorageType(Pageable pageable, String storageType);
    Page<InventoryCurrent> findByStorageTypeAndMaterialContainingIgnoreCase(Pageable pageable, String storageType, String material);
    Page<InventoryCurrent> findByStorageTypeAndMaterialDescriptionContainingIgnoreCase(
        Pageable pageable,
        String storageType,
        String materialDescription
    );
    Page<InventoryCurrent> findByStorageTypeAndMaterialContainingIgnoreCaseAndMaterialDescriptionContainingIgnoreCase(
        Pageable pageable,
        String storageType,
        String material,
        String materialDescription
    );

    @Query("select distinct ic.storageType from InventoryCurrent ic order by ic.storageType asc")
    List<String> findDistinctStorageTypes();

    // Получить все записи по одному коду материала (по всем складам)
    List<InventoryCurrent> findByMaterial(String material);

    // Получить все записи по нескольким кодам (по всем складам)
    @Query("select ic from InventoryCurrent ic where ic.material in :materials")
    List<InventoryCurrent> findByMaterialIn(java.util.Collection<String> materials);
}
