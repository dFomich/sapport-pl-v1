package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mechanic_order")
public class MechanicOrder implements Serializable {

    @Id
    private String orderId; // номер машины (уникальный)

    @Column(name = "mechanic_login", nullable = false)
    private String mechanicLogin;

    @Column(name = "storage_type")
    private String storageType;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "completed")
    private boolean completed = false;

    @Column(name = "cancelled")
    private boolean cancelled = false;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<MechanicOrderLine> lines = new ArrayList<>();

    // Геттеры и сеттеры

    public boolean isCancelled() {
        return cancelled;
    }

    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getMechanicLogin() {
        return mechanicLogin;
    }

    public void setMechanicLogin(String mechanicLogin) {
        this.mechanicLogin = mechanicLogin;
    }

    public String getStorageType() {
        return storageType;
    }

    public void setStorageType(String storageType) {
        this.storageType = storageType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public List<MechanicOrderLine> getLines() {
        return lines;
    }

    public void setLines(List<MechanicOrderLine> lines) {
        this.lines = lines;
    }
}
