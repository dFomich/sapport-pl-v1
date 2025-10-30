package com.wmm.app.service;

import com.wmm.app.domain.MechanicTile;
import com.wmm.app.domain.ProductCategory;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryVisiblePerStorageRepository;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.service.dto.MechanicTileViewDTO;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MechanicCatalogService {

    private final MechanicTileRepository tileRepo;
    private final InventoryCurrentRepository invRepo;
    private final InventoryVisiblePerStorageRepository visibleRepo;

    public MechanicCatalogService(
        MechanicTileRepository tileRepo,
        InventoryCurrentRepository invRepo,
        InventoryVisiblePerStorageRepository visibleRepo
    ) {
        this.tileRepo = tileRepo;
        this.invRepo = invRepo;
        this.visibleRepo = visibleRepo;
    }

    public Page<MechanicTileViewDTO> list(String storageType, String q, String category, Pageable pageable) {
        // 1) находим id подходящих плиток по складу и поиску
        String qNorm = (q == null || q.isBlank()) ? null : q.trim();
        List<Long> ids = tileRepo.findActiveIdsByWarehouseAndQuery(storageType, qNorm);
        if (ids.isEmpty()) return Page.empty(pageable);

        // пагинация руками по id (simple)
        int from = (int) pageable.getOffset();
        int to = Math.min(from + pageable.getPageSize(), ids.size());
        if (from >= ids.size()) return new PageImpl<>(List.of(), pageable, ids.size());
        List<Long> pageIds = ids.subList(from, to);

        // 2) грузим сами плитки — уже с жадной загрузкой categories/warehouses
        List<MechanicTile> tiles = tileRepo.findAllWithEagerRelationshipsByIdIn(pageIds);

        // 3) фильтр по категории (если задана)
        if (category != null && !category.isBlank()) {
            String catNorm = category.trim();
            tiles = tiles
                .stream()
                .filter(t ->
                    t.getCategories().stream().map(ProductCategory::getName).anyMatch(c -> c != null && c.equalsIgnoreCase(catNorm))
                )
                .collect(Collectors.toList());
        }

        // 4) подмешиваем остаток
        List<MechanicTileViewDTO> dto = tiles
            .stream()
            .map(t -> {
                Integer stock = visibleRepo
                    .findByStorageTypeAndMaterial(storageType, t.getMaterialCode())
                    .map(v -> v.getVisibleStock())
                    .orElse(0);

                Set<String> cats = t
                    .getCategories()
                    .stream()
                    .map(ProductCategory::getName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(TreeSet::new));

                //  Добавили передачу minStockAlert
                return new MechanicTileViewDTO(
                    t.getId(),
                    t.getTitle(),
                    t.getComment(),
                    t.getImageUrl(),
                    t.getMaterialCode(),
                    stock,
                    t.getMinStockAlert(),
                    cats
                );
            })
            .collect(Collectors.toList());

        return new PageImpl<>(dto, pageable, ids.size());
    }

    public List<String> categoriesForWarehouse(String storageType) {
        return tileRepo.findCategoryNamesForWarehouse(storageType);
    }
}
