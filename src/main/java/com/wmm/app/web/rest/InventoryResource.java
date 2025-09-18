package com.wmm.app.web.rest;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.InventoryUpload;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryUploadRepository;
import com.wmm.app.security.AuthoritiesConstants;
import com.wmm.app.service.InventoryImportService;
import com.wmm.app.service.dto.InventoryImportReportDTO;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.PaginationUtil;

@RestController
@RequestMapping("/api/inventory")
public class InventoryResource {

    private final InventoryImportService importService;
    private final InventoryUploadRepository uploadRepo;
    private final InventoryCurrentRepository currentRepo;

    public InventoryResource(
        InventoryImportService importService,
        InventoryUploadRepository uploadRepo,
        InventoryCurrentRepository currentRepo
    ) {
        this.importService = importService;
        this.uploadRepo = uploadRepo;
        this.currentRepo = currentRepo;
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.WAREHOUSEMAN + "','" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<InventoryImportReportDTO> importXlsx(
        @RequestPart("file") MultipartFile file,
        @RequestParam(value = "wipe", defaultValue = "false") boolean wipe,
        Authentication auth
    ) throws Exception {
        String username = auth != null ? auth.getName() : "unknown";

        // если выбрана галочка "стереть всё"
        if (wipe) {
            currentRepo.deleteAll();
        }

        InventoryImportReportDTO report = importService.importFile(file, username);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/uploads")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.WAREHOUSEMAN + "','" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<List<InventoryUpload>> listUploads(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        Page<InventoryUpload> page = uploadRepo.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    //список складов – для вкладок
    @GetMapping("/storage-types")
    @PreAuthorize(
        "hasAnyAuthority('" +
        AuthoritiesConstants.WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.SENIOR_WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.MECHANIC +
        "','" +
        AuthoritiesConstants.SENIOR_MECHANIC +
        "','" +
        AuthoritiesConstants.MANAGER +
        "','" +
        AuthoritiesConstants.SENIOR_MANAGER +
        "','" +
        AuthoritiesConstants.ADMIN +
        "')"
    )
    public ResponseEntity<List<String>> storageTypes() {
        return ResponseEntity.ok(currentRepo.findDistinctStorageTypes());
    }

    //таблица остатков с фильтрами, сортировкой, пагинацией
    @GetMapping("/current")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.WAREHOUSEMAN + "','" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<List<InventoryCurrent>> getCurrent(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam String storageType,
        @RequestParam(required = false) String material,
        @RequestParam(required = false) String name
    ) {
        Page<InventoryCurrent> page;
        String m = material == null ? "" : material;
        String d = name == null ? "" : name;

        if (!m.isBlank() && !d.isBlank()) {
            page = currentRepo.findByStorageTypeAndMaterialContainingIgnoreCaseAndMaterialDescriptionContainingIgnoreCase(
                pageable,
                storageType,
                m,
                d
            );
        } else if (!m.isBlank()) {
            page = currentRepo.findByStorageTypeAndMaterialContainingIgnoreCase(pageable, storageType, m);
        } else if (!d.isBlank()) {
            page = currentRepo.findByStorageTypeAndMaterialDescriptionContainingIgnoreCase(pageable, storageType, d);
        } else {
            page = currentRepo.findAllByStorageType(pageable, storageType);
        }

        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }
}
