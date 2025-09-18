package com.wmm.app.service.mapper;

import com.wmm.app.domain.GalleryItem;
import com.wmm.app.service.dto.GalleryItemDTO;
import org.springframework.stereotype.Service;

@Service
public class GalleryItemMapper {

    public GalleryItemDTO toDto(GalleryItem entity) {
        if (entity == null) return null;

        GalleryItemDTO dto = new GalleryItemDTO();
        dto.setId(entity.getId());
        dto.setImageUrl(entity.getImageUrl());
        dto.setCaption(entity.getCaption());
        dto.setUploadedAt(entity.getUploadedAt());
        dto.setUploadedBy(entity.getUploadedBy());
        return dto;
    }

    public GalleryItem toEntity(GalleryItemDTO dto) {
        if (dto == null) return null;

        GalleryItem entity = new GalleryItem();
        entity.setId(dto.getId());
        entity.setImageUrl(dto.getImageUrl());
        entity.setCaption(dto.getCaption());
        entity.setUploadedAt(dto.getUploadedAt());
        entity.setUploadedBy(dto.getUploadedBy());
        return entity;
    }
}
