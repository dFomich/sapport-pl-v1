package com.wmm.app.service.dto;

import java.util.List;

public class ProductGroupDTOs {

    // Список групп (карточки)
    public record GroupListItem(
        Long id,
        String name,
        String description,
        int codesCount,
        int totalStock // суммарный остаток по всем кодам (всех складов)
    ) {}

    // Деталка: по каждому коду — сумма и разбивка по складам
    public record GroupDetails(
        Long id,
        String name,
        String description,
        List<CodeInfo> codes,
        int totalStock // итого по всей группе
    ) {}

    public record CodeInfo(
        String materialCode,
        String title, // может быть пустым, если не нашли
        int totalStock,
        List<PerStorage> perStorage
    ) {}

    public record PerStorage(String storageType, int availableStock) {}
}
