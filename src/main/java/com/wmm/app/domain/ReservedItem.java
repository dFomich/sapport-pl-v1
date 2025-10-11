package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "reserved_item", uniqueConstraints = { @UniqueConstraint(columnNames = { "reserved_by", "material_code" }) })
public class ReservedItem implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    private Long id;

    @Column(name = "material_code", nullable = false, length = 64)
    private String materialCode;

    @Column(name = "qty", nullable = false)
    private Integer qty;

    @Column(name = "reserved_by", nullable = false, length = 64)
    private String reservedBy;

    @Column(name = "reserved_at", nullable = false)
    private Instant reservedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "storage_type", length = 50)
    private String storageType;

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMaterialCode() {
        return materialCode;
    }

    public void setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
    }

    public Integer getQty() {
        return qty;
    }

    public void setQty(Integer qty) {
        this.qty = qty;
    }

    public String getReservedBy() {
        return reservedBy;
    }

    public void setReservedBy(String reservedBy) {
        this.reservedBy = reservedBy;
    }

    public Instant getReservedAt() {
        return reservedAt;
    }

    public void setReservedAt(Instant reservedAt) {
        this.reservedAt = reservedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getStorageType() {
        return storageType;
    }

    public void setStorageType(String storageType) {
        this.storageType = storageType;
    }

    // --- equals & hashCode ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ReservedItem)) return false;
        ReservedItem that = (ReservedItem) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // --- toString ---

    @Override
    public String toString() {
        return (
            "ReservedItem{" +
            "id=" +
            id +
            ", materialCode='" +
            materialCode +
            '\'' +
            ", qty=" +
            qty +
            ", reservedBy='" +
            reservedBy +
            '\'' +
            ", reservedAt=" +
            reservedAt +
            ", expiresAt=" +
            expiresAt +
            ", storageType='" +
            storageType +
            '\'' +
            '}'
        );
    }
}
