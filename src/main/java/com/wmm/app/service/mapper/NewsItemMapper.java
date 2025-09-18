package com.wmm.app.service.mapper;

import com.wmm.app.domain.NewsItem;
import com.wmm.app.service.dto.NewsItemDTO;
import org.springframework.stereotype.Service;

@Service
public class NewsItemMapper {

    public NewsItemDTO toDto(NewsItem entity) {
        if (entity == null) return null;

        NewsItemDTO dto = new NewsItemDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        dto.setImageUrl(entity.getImageUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        return dto;
    }

    public NewsItem toEntity(NewsItemDTO dto) {
        if (dto == null) return null;

        NewsItem entity = new NewsItem();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setContent(dto.getContent());
        entity.setImageUrl(dto.getImageUrl());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setCreatedBy(dto.getCreatedBy());
        return entity;
    }
}
