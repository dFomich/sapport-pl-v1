package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.InventoryVisiblePerStorage;
import com.wmm.app.domain.MechanicOrderLine;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryVisiblePerStorageRepository;
import com.wmm.app.repository.MechanicOrderLineRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class InventoryVisiblePerStorageService {

    private final InventoryVisiblePerStorageRepository visibleRepo;
    private final InventoryCurrentRepository currentRepo;
    private final MechanicOrderLineRepository lineRepo;

    public InventoryVisiblePerStorageService(
        InventoryVisiblePerStorageRepository visibleRepo,
        InventoryCurrentRepository currentRepo,
        MechanicOrderLineRepository lineRepo
    ) {
        this.visibleRepo = visibleRepo;
        this.currentRepo = currentRepo;
        this.lineRepo = lineRepo;
    }

    public void recalculate(String storageType, String material) {
        // Получаем фактический остаток
        InventoryCurrent stock = currentRepo.findByStorageTypeAndMaterial(storageType, material).orElse(null);
        if (stock == null) return;

        int factualQty = stock.getAvailableStock();

        // Считаем количество в активных заявках
        int reserved = lineRepo
            .findAll()
            .stream()
            .filter(line -> Objects.equals(line.getMaterialCode(), material))
            .filter(line -> {
                var order = line.getOrder();
                return order != null && !order.isCompleted() && Objects.equals(order.getStorageType(), storageType);
            })
            .mapToInt(MechanicOrderLine::getQty)
            .sum();

        int visibleQty = Math.max(0, factualQty - reserved);

        // Обновляем или создаём запись
        InventoryVisiblePerStorage visible = visibleRepo
            .findByStorageTypeAndMaterial(storageType, material)
            .orElse(new InventoryVisiblePerStorage());

        visible.setStorageType(storageType);
        visible.setMaterial(material);
        visible.setMaterialDescription(stock.getMaterialDescription());
        visible.setVisibleStock(visibleQty);
        visible.setUpdatedAt(Instant.now());

        visibleRepo.save(visible);
    }
}
