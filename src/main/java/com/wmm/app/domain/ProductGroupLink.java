package com.wmm.app.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "product_group_link")
public class ProductGroupLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private ProductGroup group;

    @Column(name = "material_code", nullable = false)
    private String materialCode;

    @Column(name = "added_by")
    private String addedBy;

    @Column(name = "added_at")
    private Instant addedAt = Instant.now();

    // getters/setters
    public Long getId() {
        return id;
    }

    public ProductGroupLink setId(Long id) {
        this.id = id;
        return this;
    }

    public ProductGroup getGroup() {
        return group;
    }

    public ProductGroupLink setGroup(ProductGroup group) {
        this.group = group;
        return this;
    }

    public String getMaterialCode() {
        return materialCode;
    }

    public ProductGroupLink setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
        return this;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public ProductGroupLink setAddedBy(String addedBy) {
        this.addedBy = addedBy;
        return this;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public ProductGroupLink setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
        return this;
    }
}
