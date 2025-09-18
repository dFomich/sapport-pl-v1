package com.wmm.app.web.rest;

import com.wmm.app.service.GalleryItemService;
import com.wmm.app.service.dto.GalleryItemDTO;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;

@RestController
@RequestMapping("/api/gallery")
public class GalleryItemResource {

    private final GalleryItemService galleryItemService;

    public GalleryItemResource(GalleryItemService service) {
        this.galleryItemService = service;
    }

    @GetMapping
    public List<GalleryItemDTO> getAll() {
        return galleryItemService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<GalleryItemDTO> create(@RequestBody GalleryItemDTO dto) throws URISyntaxException {
        GalleryItemDTO result = galleryItemService.save(dto, "system");
        return ResponseEntity.created(new URI("/api/gallery/" + result.getId())).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<GalleryItemDTO> update(@PathVariable Long id, @RequestBody GalleryItemDTO dto) {
        dto.setId(id);
        GalleryItemDTO result = galleryItemService.save(dto, "system");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        galleryItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
