package com.wmm.app.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.List;

public class MechanicOrderDTO implements Serializable {

    @NotBlank
    private String orderId;

    @NotBlank
    private String storageType;

    @NotEmpty
    private List<Line> lines;

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStorageType() {
        return storageType;
    }

    public void setStorageType(String storageType) {
        this.storageType = storageType;
    }

    public List<Line> getLines() {
        return lines;
    }

    public void setLines(List<Line> lines) {
        this.lines = lines;
    }

    public static class Line implements Serializable {

        @NotNull
        private Long tileId;

        @NotBlank
        private String material; // materialCode

        @Min(1)
        private Integer qty;

        public Long getTileId() {
            return tileId;
        }

        public void setTileId(Long tileId) {
            this.tileId = tileId;
        }

        public String getMaterial() {
            return material;
        }

        public void setMaterial(String material) {
            this.material = material;
        }

        public Integer getQty() {
            return qty;
        }

        public void setQty(Integer qty) {
            this.qty = qty;
        }
    }
}
