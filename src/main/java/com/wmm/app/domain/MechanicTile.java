package com.wmm.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A MechanicTile.
 */
@Entity
@Table(name = "mechanic_tile")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class MechanicTile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 255)
    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Size(max = 1024)
    @Column(name = "comment", length = 1024)
    private String comment;

    @NotNull
    @Size(max = 64)
    @Column(name = "material_code", length = 64, nullable = false)
    private String materialCode;

    @Size(max = 512)
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @NotNull
    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "min_stock_alert")
    private Integer minStockAlert = 0; // Минимальный остаток для уведомления

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_mechanic_tile__categories",
        joinColumns = @JoinColumn(name = "mechanic_tile_id"),
        inverseJoinColumns = @JoinColumn(name = "categories_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "tiles" }, allowSetters = true)
    private Set<ProductCategory> categories = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_mechanic_tile__warehouses",
        joinColumns = @JoinColumn(name = "mechanic_tile_id"),
        inverseJoinColumns = @JoinColumn(name = "warehouses_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "tiles" }, allowSetters = true)
    private Set<Warehouse> warehouses = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Integer getMinStockAlert() {
        return minStockAlert;
    }

    public MechanicTile minStockAlert(Integer minStockAlert) {
        this.setMinStockAlert(minStockAlert);
        return this;
    }

    public void setMinStockAlert(Integer minStockAlert) {
        this.minStockAlert = minStockAlert;
    }

    public Long getId() {
        return this.id;
    }

    public MechanicTile id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return this.title;
    }

    public MechanicTile title(String title) {
        this.setTitle(title);
        return this;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComment() {
        return this.comment;
    }

    public MechanicTile comment(String comment) {
        this.setComment(comment);
        return this;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getMaterialCode() {
        return this.materialCode;
    }

    public MechanicTile materialCode(String materialCode) {
        this.setMaterialCode(materialCode);
        return this;
    }

    public void setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
    }

    public String getImageUrl() {
        return this.imageUrl;
    }

    public MechanicTile imageUrl(String imageUrl) {
        this.setImageUrl(imageUrl);
        return this;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getActive() {
        return this.active;
    }

    public MechanicTile active(Boolean active) {
        this.setActive(active);
        return this;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Set<ProductCategory> getCategories() {
        return this.categories;
    }

    public void setCategories(Set<ProductCategory> productCategories) {
        this.categories = productCategories;
    }

    public MechanicTile categories(Set<ProductCategory> productCategories) {
        this.setCategories(productCategories);
        return this;
    }

    public MechanicTile addCategories(ProductCategory productCategory) {
        this.categories.add(productCategory);
        return this;
    }

    public MechanicTile removeCategories(ProductCategory productCategory) {
        this.categories.remove(productCategory);
        return this;
    }

    public Set<Warehouse> getWarehouses() {
        return this.warehouses;
    }

    public void setWarehouses(Set<Warehouse> warehouses) {
        this.warehouses = warehouses;
    }

    public MechanicTile warehouses(Set<Warehouse> warehouses) {
        this.setWarehouses(warehouses);
        return this;
    }

    public MechanicTile addWarehouses(Warehouse warehouse) {
        this.warehouses.add(warehouse);
        return this;
    }

    public MechanicTile removeWarehouses(Warehouse warehouse) {
        this.warehouses.remove(warehouse);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof MechanicTile)) {
            return false;
        }
        return getId() != null && getId().equals(((MechanicTile) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "MechanicTile{" +
            "id=" + getId() +
            ", title='" + getTitle() + "'" +
            ", comment='" + getComment() + "'" +
            ", materialCode='" + getMaterialCode() + "'" +
            ", imageUrl='" + getImageUrl() + "'" +
            ", active='" + getActive() + "'" +
            "}";
    }
}
