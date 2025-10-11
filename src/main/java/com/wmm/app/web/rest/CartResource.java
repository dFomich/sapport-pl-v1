package com.wmm.app.web.rest;

import com.wmm.app.domain.ReservedItem;
import com.wmm.app.repository.ReservedItemRepository;
import com.wmm.app.service.CartReservationService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing cart reservations.
 */
@RestController
@RequestMapping("/api/cart")
@Transactional
public class CartResource {

    private final CartReservationService cartReservationService;
    private final ReservedItemRepository reservedItemRepository;

    public CartResource(CartReservationService cartReservationService, ReservedItemRepository reservedItemRepository) {
        this.cartReservationService = cartReservationService;
        this.reservedItemRepository = reservedItemRepository;
    }

    /**
     * POST /api/cart/reserve : Reserve an item for a specific user.
     */
    @PostMapping("/reserve")
    public ResponseEntity<ReservedItem> reserveItem(@Valid @RequestBody Map<String, Object> request, Authentication authentication) {
        String user = authentication.getName();
        String materialCode = (String) request.get("materialCode");
        int qty = (int) request.get("qty");
        String storageType = (String) request.getOrDefault("storageType", "DEFAULT");

        ReservedItem item = cartReservationService.reserveItem(materialCode, qty, user, storageType);
        return ResponseEntity.ok(item);
    }

    /**
     * DELETE /api/cart/reserve/{materialCode} : Release one reserved item.
     */
    @DeleteMapping("/reserve/{materialCode}")
    public ResponseEntity<Void> releaseItem(@PathVariable String materialCode, Authentication authentication) {
        String user = authentication.getName();
        cartReservationService.releaseItem(materialCode, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/cart/reserve : Release all reservations for current user.
     */
    @DeleteMapping("/reserve")
    public ResponseEntity<Void> releaseAll(Authentication authentication) {
        String user = authentication.getName();
        cartReservationService.releaseAll(user);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/cart/heartbeat : Extend reservations by +1 minute (test mode).
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(Authentication authentication) {
        String user = authentication.getName();
        cartReservationService.extendReservations(user);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/cart/reserved-counts : Returns total reserved quantities for given materials (excluding current user).
     */
    @GetMapping("/reserved-counts")
    public ResponseEntity<Map<String, Integer>> getReservedCounts(
        @RequestParam("materials") String materials,
        Authentication authentication
    ) {
        String currentUser = authentication.getName();
        Instant now = Instant.now();

        Map<String, Integer> result = new HashMap<>();
        for (String materialCode : materials.split(",")) {
            int reservedCount = reservedItemRepository.sumActiveByMaterialExcludingUser(materialCode, now, currentUser);
            result.put(materialCode, reservedCount);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/cart/my-reservations : Return all active reservations of current user.
     */
    @GetMapping("/my-reservations")
    public ResponseEntity<List<Map<String, Object>>> getMyReservations(Authentication authentication) {
        String user = authentication.getName();
        Instant now = Instant.now();

        List<ReservedItem> items = cartReservationService.getActiveReservations(user);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ReservedItem r : items) {
            if (r.getExpiresAt() != null && r.getExpiresAt().isAfter(now)) {
                Map<String, Object> map = new HashMap<>();
                map.put("materialCode", r.getMaterialCode());
                map.put("qty", r.getQty());
                map.put("storageType", r.getStorageType());
                map.put("expiresAt", r.getExpiresAt());
                result.add(map);
            }
        }

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/cart/confirm : Confirm order and clear all reservations.
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmOrder(@Valid @RequestBody Map<String, Object> body, Authentication authentication) {
        String user = authentication.getName();

        // просто имитация подтверждения (логика заказа реализуется позже)
        cartReservationService.releaseAll(user);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("confirmedAt", Instant.now());
        return ResponseEntity.ok(response);
    }
}
