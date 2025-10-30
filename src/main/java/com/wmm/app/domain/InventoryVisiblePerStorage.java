package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(
    name = "inventory_visible",
    uniqueConstraints = { @UniqueConstraint(name = "ux_inventoryvisible_st_mat", columnNames = { "storage_type", "material" }) }
)
public class InventoryVisiblePerStorage implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "storage_type", nullable = false, length = 32)
    private String storageType;

    @Column(name = "material", nullable = false, length = 64)
    private String material;

    @Column(name = "material_description", nullable = false, length = 255)
    private String materialDescription;

    @Column(name = "visible_stock", nullable = false)
    private Integer visibleStock;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // --- Геттеры и сеттеры ---
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

    public Integer getVisibleStock() {
        return visibleStock;
    }

    public void setVisibleStock(Integer visibleStock) {
        this.visibleStock = visibleStock;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
