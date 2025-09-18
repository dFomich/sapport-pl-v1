package com.wmm.app.service;

import com.wmm.app.domain.GalleryItem;
import com.wmm.app.repository.GalleryItemRepository;
import com.wmm.app.service.dto.GalleryItemDTO;
import com.wmm.app.service.mapper.GalleryItemMapper;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class GalleryItemService {

    private final GalleryItemRepository galleryItemRepository;
    private final GalleryItemMapper galleryItemMapper;

    public GalleryItemService(GalleryItemRepository repository, GalleryItemMapper mapper) {
        this.galleryItemRepository = repository;
        this.galleryItemMapper = mapper;
    }

    public GalleryItemDTO save(GalleryItemDTO dto, String currentUserLogin) {
        GalleryItem entity = galleryItemMapper.toEntity(dto);
        if (entity.getId() == null) {
            entity.setUploadedAt(Instant.now());
            entity.setUploadedBy(currentUserLogin);
        }
        return galleryItemMapper.toDto(galleryItemRepository.save(entity));
    }

    public List<GalleryItemDTO> findAll() {
        return galleryItemRepository.findAll().stream().map(galleryItemMapper::toDto).collect(Collectors.toList());
    }

    public void delete(Long id) {
        galleryItemRepository.deleteById(id);
    }
}
