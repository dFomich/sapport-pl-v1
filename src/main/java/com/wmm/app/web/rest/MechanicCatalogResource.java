package com.wmm.app.web.rest;

import com.wmm.app.security.AuthoritiesConstants;
import com.wmm.app.service.MechanicCatalogService;
import com.wmm.app.service.dto.MechanicTileViewDTO;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.PaginationUtil;

@RestController
@RequestMapping("/api/mechanic/catalog")
public class MechanicCatalogResource {

    private final MechanicCatalogService service;

    public MechanicCatalogResource(MechanicCatalogService service) {
        this.service = service;
    }

    @GetMapping("/tiles")
    @PreAuthorize(
        "hasAnyAuthority('" +
        AuthoritiesConstants.MECHANIC +
        "','" +
        AuthoritiesConstants.SENIOR_WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.SENIOR_MECHANIC +
        "','" +
        AuthoritiesConstants.MANAGER +
        "','" +
        AuthoritiesConstants.SENIOR_MANAGER +
        "')"
    )
    public ResponseEntity<List<MechanicTileViewDTO>> tiles(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam String storageType,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category
    ) {
        Page<MechanicTileViewDTO> page = service.list(storageType, q, category, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    @GetMapping("/categories")
    @PreAuthorize(
        "hasAnyAuthority('" +
        AuthoritiesConstants.MECHANIC +
        "','" +
        AuthoritiesConstants.SENIOR_WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.SENIOR_MECHANIC +
        "','" +
        AuthoritiesConstants.MANAGER +
        "','" +
        AuthoritiesConstants.SENIOR_MANAGER +
        "')"
    )
    public ResponseEntity<List<String>> categories(@RequestParam String storageType) {
        return ResponseEntity.ok(service.categoriesForWarehouse(storageType));
    }
}
