package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.InventoryRow;
import com.wmm.app.domain.InventoryUpload;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryRowRepository;
import com.wmm.app.repository.InventoryUploadRepository;
import com.wmm.app.service.dto.InventoryImportReportDTO;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class InventoryImportService {

    private final org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();

    private static String norm(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[^a-z0-9]+", "");
    }

    private static final List<String> STORAGE_TYPE_ALIASES = List.of("storagetype", "stgetype", "storagelocation");
    private static final List<String> MATERIAL_ALIASES = List.of("material", "materialno", "matnr");
    private static final List<String> MATERIAL_DESC_ALIASES = List.of("materialdescription", "description", "shorttext");
    private static final List<String> AVAILABLE_STOCK_ALIASES = List.of(
        "availablestock",
        "availiabestock",
        "availableqty",
        "unrestrictedstock",
        "stock"
    );

    private final InventoryUploadRepository uploadRepo;
    private final InventoryRowRepository rowRepo;
    private final InventoryCurrentRepository currentRepo;
    private final InventoryVisiblePerStorageService visiblePerStorageService;

    public InventoryImportService(
        InventoryUploadRepository uploadRepo,
        InventoryRowRepository rowRepo,
        InventoryCurrentRepository currentRepo,
        InventoryVisiblePerStorageService visiblePerStorageService
    ) {
        this.uploadRepo = uploadRepo;
        this.rowRepo = rowRepo;
        this.currentRepo = currentRepo;
        this.visiblePerStorageService = visiblePerStorageService;
    }

    @Transactional
    public InventoryImportReportDTO importFile(MultipartFile file, String uploadedBy) throws Exception {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Empty file");
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.xlsx";

        List<InventoryRow> parsed = new ArrayList<>();
        Set<String> storageTypes = new HashSet<>();

        try (InputStream is = file.getInputStream(); Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) throw new IllegalArgumentException("No sheet 0");

            // найти индексы нужных колонок по заголовкам
            Row header = sheet.getRow(0);
            Map<String, Integer> idx = headerMap(header);

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String storageType = getString(row, idx.get("Storage Type"));
                String material = getString(row, idx.get("Material"));
                String materialDescription = getString(row, idx.get("Material Description"));
                Integer availableStock = getInt(row, idx.get("Available Stock"));

                if (!StringUtils.hasText(storageType) || !StringUtils.hasText(material)) continue;

                InventoryRow ir = new InventoryRow();
                ir.setStorageType(storageType.trim());
                ir.setMaterial(material.trim());
                ir.setMaterialDescription(materialDescription != null ? materialDescription.trim() : "");
                ir.setAvailableStock(availableStock != null ? availableStock : 0);
                parsed.add(ir);
                storageTypes.add(ir.getStorageType());
            }

            for (String storageType : storageTypes) {
                visiblePerStorageService.clearVisibleStockForStorage(storageType);
            }
        }

        // создать запись загрузки
        InventoryUpload up = new InventoryUpload();
        up.setOriginalFilename(original);
        up.setUploadedBy(uploadedBy);
        up.setUploadedAt(Instant.now());
        up.setTotalRows(parsed.size());
        up.setAddedCount(0);
        up.setUpdatedCount(0);
        up.setStorageTypesFound(storageTypes.isEmpty() ? "[]" : toJsonArray(storageTypes));
        uploadRepo.save(up);

        // сохранить строки загрузки (связать upload)
        for (InventoryRow ir : parsed) ir.setUpload(up);
        rowRepo.saveAll(parsed);

        // агрегировать по (storageType, material) и обновить InventoryCurrent
        Map<String, Integer> agg = parsed
            .stream()
            .collect(
                Collectors.groupingBy(
                    ir -> ir.getStorageType() + "||" + ir.getMaterial(),
                    Collectors.summingInt(InventoryRow::getAvailableStock)
                )
            );

        int added = 0, updated = 0;
        for (Map.Entry<String, Integer> e : agg.entrySet()) {
            String[] parts = e.getKey().split("\\|\\|", 2);
            String st = parts[0];
            String mat = parts[1];
            Integer sum = e.getValue();

            Optional<InventoryCurrent> existingOpt = currentRepo.findByStorageTypeAndMaterial(st, mat);
            if (existingOpt.isPresent()) {
                InventoryCurrent ec = existingOpt.get();
                if (!Objects.equals(ec.getAvailableStock(), sum)) {
                    ec.setAvailableStock(sum);
                    ec.setUpdatedAt(Instant.now());
                    // обновляем описание последней строки для читаемости
                    ec.setMaterialDescription(
                        parsed
                            .stream()
                            .filter(x -> x.getStorageType().equals(st) && x.getMaterial().equals(mat))
                            .map(InventoryRow::getMaterialDescription)
                            .filter(Objects::nonNull)
                            .findFirst()
                            .orElse(ec.getMaterialDescription())
                    );
                    currentRepo.save(ec);
                    updated++;
                    visiblePerStorageService.recalculate(st, mat);
                }
            } else {
                InventoryCurrent nc = new InventoryCurrent();
                nc.setStorageType(st);
                nc.setMaterial(mat);
                nc.setMaterialDescription(
                    parsed
                        .stream()
                        .filter(x -> x.getStorageType().equals(st) && x.getMaterial().equals(mat))
                        .map(InventoryRow::getMaterialDescription)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse("")
                );
                nc.setAvailableStock(sum);
                nc.setUpdatedAt(Instant.now());
                currentRepo.save(nc);
                added++;
                visiblePerStorageService.recalculate(st, mat);
            }
        }

        up.setAddedCount(added);
        up.setUpdatedCount(updated);
        uploadRepo.save(up);

        return new InventoryImportReportDTO(original, parsed.size(), added, updated, storageTypes.toArray(new String[0]));
    }

    private Map<String, Integer> headerMap(Row header) {
        Map<String, Integer> normToIdx = new HashMap<>();
        for (int c = 0; c < header.getLastCellNum(); c++) {
            Cell cell = header.getCell(c);
            if (cell != null && cell.getStringCellValue() != null) {
                normToIdx.put(norm(cell.getStringCellValue()), c);
            }
        }

        Integer stIdx = findByAliases(normToIdx, STORAGE_TYPE_ALIASES);
        Integer matIdx = findByAliases(normToIdx, MATERIAL_ALIASES);
        Integer descIdx = findByAliases(normToIdx, MATERIAL_DESC_ALIASES);
        Integer qtyIdx = findByAliases(normToIdx, AVAILABLE_STOCK_ALIASES);

        List<String> missing = new ArrayList<>();
        if (stIdx == null) missing.add("Storage Type");
        if (matIdx == null) missing.add("Material");
        if (descIdx == null) missing.add("Material Description");
        if (qtyIdx == null) missing.add("Available Stock");

        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Missing column(s): " + String.join(", ", missing));
        }

        Map<String, Integer> map = new HashMap<>();
        map.put("Storage Type", stIdx);
        map.put("Material", matIdx);
        map.put("Material Description", descIdx);
        map.put("Available Stock", qtyIdx);
        return map;
    }

    private static Integer findByAliases(Map<String, Integer> normToIdx, List<String> aliases) {
        for (String alias : aliases) {
            if (normToIdx.containsKey(alias)) return normToIdx.get(alias);
        }
        return null;
    }

    private String getString(Row row, Integer idx) {
        if (idx == null) return null;
        Cell cell = row.getCell(idx);
        return cell == null ? null : formatter.formatCellValue(cell).trim();
    }

    /**
     * Парсинг количества, устойчивый к тысячным пробелам/неразрывным пробелам/точкам/запятым.
     * Примеры входа: "1 234", "1 234", "1.234", "1,234", "1 234,00" → 1234
     */
    private Integer getInt(Row row, Integer idx) {
        if (idx == null) return 0;
        Cell cell = row.getCell(idx);
        String v = cell == null ? "" : formatter.formatCellValue(cell).trim();
        if (v.isBlank()) return 0;

        // NBSP и NARROW NBSP
        v = v.replace("\u00A0", "").replace("\u202F", "");
        // убрать все, кроме цифр и минуса
        v = v.replaceAll("[^0-9-]", "");

        if (v.isEmpty() || "-".equals(v)) return 0;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String toJsonArray(Set<String> set) {
        return set.stream().sorted().map(s -> "\"" + s.replace("\"", "\\\"") + "\"").collect(Collectors.joining(",", "[", "]"));
    }
}
