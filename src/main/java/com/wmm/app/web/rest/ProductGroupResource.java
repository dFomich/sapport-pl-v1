package com.wmm.app.web.rest;

import com.wmm.app.security.AuthoritiesConstants;
import com.wmm.app.service.ProductGroupService;
import com.wmm.app.service.dto.ProductGroupDTOs.*;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product-groups")
public class ProductGroupResource {

    private final ProductGroupService service;

    public ProductGroupResource(ProductGroupService service) {
        this.service = service;
    }

    private String currentLogin() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // Список групп с агрегатами
    @GetMapping
    @PreAuthorize(
        "hasAnyAuthority('" +
        AuthoritiesConstants.WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.SENIOR_WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.MANAGER +
        "','" +
        AuthoritiesConstants.SENIOR_MANAGER +
        "')"
    )
    public ResponseEntity<List<GroupListItem>> list() {
        return ResponseEntity.ok(service.list());
    }

    // Деталка по группе
    @GetMapping("/{id}")
    @PreAuthorize(
        "hasAnyAuthority('" +
        AuthoritiesConstants.WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.SENIOR_WAREHOUSEMAN +
        "','" +
        AuthoritiesConstants.MANAGER +
        "','" +
        AuthoritiesConstants.SENIOR_MANAGER +
        "')"
    )
    public ResponseEntity<GroupDetails> details(@PathVariable Long id) {
        return ResponseEntity.ok(service.details(id));
    }

    // Создать группу (только старший кладовщик)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<GroupListItem> create(@RequestBody Map<String, String> req) {
        String name = req.getOrDefault("name", "").trim();
        String description = req.getOrDefault("description", "").trim();
        var g = service.create(name, description, currentLogin());
        // вернём в формате списка (с нулевыми агрегатами)
        return ResponseEntity.ok(new GroupListItem(g.getId(), g.getName(), g.getDescription(), 0, 0));
    }

    // Добавить коды в группу
    @PostMapping("/{id}/codes")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<Void> addCodes(@PathVariable Long id, @RequestBody List<String> codes) {
        service.addCodes(id, codes, currentLogin());
        return ResponseEntity.noContent().build();
    }

    // Удалить код из группы
    @DeleteMapping("/{id}/codes/{materialCode}")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<Void> removeCode(@PathVariable Long id, @PathVariable String materialCode) {
        service.removeCode(id, materialCode);
        return ResponseEntity.noContent().build();
    }

    // Удалить группу
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Обновить название и описание группы
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('" + AuthoritiesConstants.SENIOR_WAREHOUSEMAN + "')")
    public ResponseEntity<Void> updateGroup(@PathVariable Long id, @RequestBody Map<String, String> req) {
        String name = req.getOrDefault("name", "").trim();
        String description = req.getOrDefault("description", "").trim();

        service.update(id, name, description);
        return ResponseEntity.noContent().build();
    }
}
