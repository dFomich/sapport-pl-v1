package com.wmm.app.service.dto;

public class InventoryImportReportDTO {

    public String originalFilename;
    public int totalRows;
    public int addedCount;
    public int updatedCount;
    public String[] storageTypesFound;

    public InventoryImportReportDTO(String originalFilename, int totalRows, int addedCount, int updatedCount, String[] storageTypesFound) {
        this.originalFilename = originalFilename;
        this.totalRows = totalRows;
        this.addedCount = addedCount;
        this.updatedCount = updatedCount;
        this.storageTypesFound = storageTypesFound;
    }
}
