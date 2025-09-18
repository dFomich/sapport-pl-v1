package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "inventory_row")
public class InventoryRow implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "storage_type", nullable = false, length = 32)
    private String storageType;

    @Column(name = "material", nullable = false, length = 64)
    private String material;

    @Column(name = "material_description", nullable = false, length = 255)
    private String materialDescription;

    @Column(name = "available_stock", nullable = false)
    private Integer availableStock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "upload_id")
    private InventoryUpload upload;

    // getters/setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStorageType() {
        return storageType;
    }

    public void setStorageType(String storageType) {
        this.storageType = storageType;
    }

    public String getMaterial() {
        return material;
    }

    public void setMaterial(String material) {
        this.material = material;
    }

    public String getMaterialDescription() {
        return materialDescription;
    }

    public void setMaterialDescription(String materialDescription) {
        this.materialDescription = materialDescription;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(Integer availableStock) {
        this.availableStock = availableStock;
    }

    public InventoryUpload getUpload() {
        return upload;
    }

    public void setUpload(InventoryUpload upload) {
        this.upload = upload;
    }
}
