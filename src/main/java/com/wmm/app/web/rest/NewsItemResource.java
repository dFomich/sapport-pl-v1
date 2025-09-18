package com.wmm.app.web.rest;

import com.wmm.app.service.NewsItemService;
import com.wmm.app.service.dto.NewsItemDTO;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;

@RestController
@RequestMapping("/api/news")
public class NewsItemResource {

    private final NewsItemService newsItemService;

    public NewsItemResource(NewsItemService service) {
        this.newsItemService = service;
    }

    @GetMapping
    public List<NewsItemDTO> getAll() {
        return newsItemService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<NewsItemDTO> create(@RequestBody NewsItemDTO dto) throws URISyntaxException {
        NewsItemDTO result = newsItemService.save(dto, "system"); // заменим позже на текущего пользователя
        return ResponseEntity.created(new URI("/api/news/" + result.getId())).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<NewsItemDTO> update(@PathVariable Long id, @RequestBody NewsItemDTO dto) {
        dto.setId(id);
        NewsItemDTO result = newsItemService.save(dto, "system");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        newsItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
