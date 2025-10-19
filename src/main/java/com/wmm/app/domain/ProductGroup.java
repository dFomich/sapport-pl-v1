package com.wmm.app.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "product_group")
public class ProductGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // getters/setters
    public Long getId() {
        return id;
    }

    public ProductGroup setId(Long id) {
        this.id = id;
        return this;
    }

    public String getName() {
        return name;
    }

    public ProductGroup setName(String name) {
        this.name = name;
        return this;
    }

    public String getDescription() {
        return description;
    }

    public ProductGroup setDescription(String description) {
        this.description = description;
        return this;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public ProductGroup setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
        return this;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public ProductGroup setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }
}
