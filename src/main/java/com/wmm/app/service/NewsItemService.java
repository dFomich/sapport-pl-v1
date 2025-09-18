package com.wmm.app.service;

import com.wmm.app.domain.NewsItem;
import com.wmm.app.repository.NewsItemRepository;
import com.wmm.app.service.dto.NewsItemDTO;
import com.wmm.app.service.mapper.NewsItemMapper;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NewsItemService {

    private final NewsItemRepository newsItemRepository;
    private final NewsItemMapper newsItemMapper;

    public NewsItemService(NewsItemRepository repository, NewsItemMapper mapper) {
        this.newsItemRepository = repository;
        this.newsItemMapper = mapper;
    }

    public NewsItemDTO save(NewsItemDTO dto, String currentUserLogin) {
        NewsItem entity = newsItemMapper.toEntity(dto);
        if (entity.getId() == null) {
            entity.setCreatedAt(Instant.now());
            entity.setCreatedBy(currentUserLogin);
        }
        return newsItemMapper.toDto(newsItemRepository.save(entity));
    }

    public List<NewsItemDTO> findAll() {
        return newsItemRepository.findAll().stream().map(newsItemMapper::toDto).collect(Collectors.toList());
    }

    public void delete(Long id) {
        newsItemRepository.deleteById(id);
    }
}
