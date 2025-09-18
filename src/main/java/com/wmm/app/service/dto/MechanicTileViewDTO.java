package com.wmm.app.service.dto;

import java.util.Set;

public class MechanicTileViewDTO {

    public Long id;
    public String title;
    public String comment;
    public String imageUrl;
    public String materialCode;
    public int availableStock; // по выбранному складу
    public Set<String> categories;

    public MechanicTileViewDTO(
        Long id,
        String title,
        String comment,
        String imageUrl,
        String materialCode,
        Integer availableStock,
        Set<String> categories
    ) {
        this.id = id;
        this.title = title;
        this.comment = comment;
        this.imageUrl = imageUrl;
        this.materialCode = materialCode;
        this.availableStock = availableStock == null ? 0 : availableStock;
        this.categories = categories;
    }
}
