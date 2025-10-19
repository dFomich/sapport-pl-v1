package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.ProductGroup;
import com.wmm.app.domain.ProductGroupLink;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.ProductGroupLinkRepository;
import com.wmm.app.repository.ProductGroupRepository;
import com.wmm.app.service.dto.ProductGroupDTOs.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductGroupService {

    private final ProductGroupRepository groupRepo;
    private final ProductGroupLinkRepository linkRepo;
    private final InventoryCurrentRepository invRepo;

    public ProductGroupService(ProductGroupRepository groupRepo, ProductGroupLinkRepository linkRepo, InventoryCurrentRepository invRepo) {
        this.groupRepo = groupRepo;
        this.linkRepo = linkRepo;
        this.invRepo = invRepo;
    }

    // === CRUD ===

    public ProductGroup create(String name, String description, String createdBy) {
        ProductGroup g = new ProductGroup().setName(name).setDescription(description).setCreatedBy(createdBy).setCreatedAt(Instant.now());
        return groupRepo.save(g);
    }

    public void delete(Long id) {
        // каскада нет — сначала удалим связи
        linkRepo.findByGroupId(id).forEach(linkRepo::delete);
        groupRepo.deleteById(id);
    }

    public List<GroupListItem> list() {
        List<ProductGroup> groups = groupRepo.findAll();

        // Подтянем все коды разом → посчитаем итого
        Map<Long, List<ProductGroupLink>> byGroup = groups
            .stream()
            .collect(Collectors.toMap(ProductGroup::getId, g -> linkRepo.findByGroupId(g.getId())));

        // Соберём все материалы единой пачкой для одной выборки остатков
        Set<String> allCodes = byGroup
            .values()
            .stream()
            .flatMap(List::stream)
            .map(ProductGroupLink::getMaterialCode)
            .collect(Collectors.toSet());

        Map<String, Integer> totalByCode = new HashMap<>();
        if (!allCodes.isEmpty()) {
            List<InventoryCurrent> all = invRepo.findByMaterialIn(allCodes);
            all.forEach(ic -> totalByCode.merge(ic.getMaterial(), Optional.ofNullable(ic.getAvailableStock()).orElse(0), Integer::sum));
        }

        List<GroupListItem> items = new ArrayList<>();
        for (ProductGroup g : groups) {
            List<ProductGroupLink> links = byGroup.getOrDefault(g.getId(), List.of());
            int codesCount = links.size();
            int total = links.stream().mapToInt(l -> totalByCode.getOrDefault(l.getMaterialCode(), 0)).sum();
            items.add(new GroupListItem(g.getId(), g.getName(), g.getDescription(), codesCount, total));
        }
        return items;
    }

    @Transactional(readOnly = true)
    public GroupDetails details(Long id) {
        ProductGroup g = groupRepo.findById(id).orElseThrow();
        List<ProductGroupLink> links = linkRepo.findByGroupId(id);
        List<CodeInfo> codes = new ArrayList<>();

        int groupTotal = 0;

        for (ProductGroupLink l : links) {
            String code = l.getMaterialCode();
            List<InventoryCurrent> ics = invRepo.findByMaterial(code);

            // Разбивка по складам
            Map<String, Integer> perStorageMap = new HashMap<>();
            for (InventoryCurrent ic : ics) {
                int qty = Optional.ofNullable(ic.getAvailableStock()).orElse(0);
                perStorageMap.merge(ic.getStorageType(), qty, Integer::sum);
            }

            int total = perStorageMap.values().stream().mapToInt(Integer::intValue).sum();
            groupTotal += total;

            // Получим описание товара из InventoryCurrent (если есть)
            String title = invRepo
                .findByMaterial(code)
                .stream()
                .map(InventoryCurrent::getMaterialDescription)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("");

            // Добавляем в список кодов с названием
            codes.add(
                new CodeInfo(
                    code,
                    title,
                    total,
                    perStorageMap
                        .entrySet()
                        .stream()
                        .map(e -> new PerStorage(e.getKey(), e.getValue()))
                        .sorted(Comparator.comparing(PerStorage::storageType))
                        .toList()
                )
            );
        }

        // Отсортируем коды по убыванию остатков (удобнее смотреть)
        codes = codes.stream().sorted(Comparator.comparing(CodeInfo::totalStock).reversed()).toList();

        return new GroupDetails(g.getId(), g.getName(), g.getDescription(), codes, groupTotal);
    }

    public void addCodes(Long groupId, List<String> materialCodes, String addedBy) {
        ProductGroup g = groupRepo.findById(groupId).orElseThrow();
        if (materialCodes == null || materialCodes.isEmpty()) return;

        // защитимся от дублей
        Set<String> existing = linkRepo.findByGroup(g).stream().map(ProductGroupLink::getMaterialCode).collect(Collectors.toSet());

        for (String code : materialCodes) {
            if (code == null || code.isBlank() || existing.contains(code)) continue;
            ProductGroupLink l = new ProductGroupLink().setGroup(g).setMaterialCode(code.trim()).setAddedBy(addedBy);
            linkRepo.save(l);
        }
    }

    public void removeCode(Long groupId, String materialCode) {
        ProductGroup g = groupRepo.findById(groupId).orElseThrow();
        linkRepo.findByGroup(g).stream().filter(l -> materialCode.equals(l.getMaterialCode())).findFirst().ifPresent(linkRepo::delete);
    }
}
