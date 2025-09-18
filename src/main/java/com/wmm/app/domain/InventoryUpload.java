package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventory_upload")
public class InventoryUpload implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "total_rows", nullable = false)
    private Integer totalRows;

    @Column(name = "added_count", nullable = false)
    private Integer addedCount;

    @Column(name = "updated_count", nullable = false)
    private Integer updatedCount;

    // JSON-строка: ["BUD","CLD"]
    @Column(name = "storage_types_found", columnDefinition = "text")
    private String storageTypesFound;

    @OneToMany(mappedBy = "upload", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryRow> rows = new ArrayList<>();

    // getters/setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Integer getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(Integer totalRows) {
        this.totalRows = totalRows;
    }

    public Integer getAddedCount() {
        return addedCount;
    }

    public void setAddedCount(Integer addedCount) {
        this.addedCount = addedCount;
    }

    public Integer getUpdatedCount() {
        return updatedCount;
    }

    public void setUpdatedCount(Integer updatedCount) {
        this.updatedCount = updatedCount;
    }

    public String getStorageTypesFound() {
        return storageTypesFound;
    }

    public void setStorageTypesFound(String storageTypesFound) {
        this.storageTypesFound = storageTypesFound;
    }

    public List<InventoryRow> getRows() {
        return rows;
    }

    public void setRows(List<InventoryRow> rows) {
        this.rows = rows;
    }
}
