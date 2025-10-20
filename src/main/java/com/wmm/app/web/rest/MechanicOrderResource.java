package com.wmm.app.web.rest;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.MechanicOrder;
import com.wmm.app.domain.MechanicOrderLine;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.MechanicOrderRepository;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.service.MechanicOrderService;
import com.wmm.app.service.TelegramBotService;
import com.wmm.app.web.rest.errors.BadRequestAlertException;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;

@RestController
@RequestMapping("/api/mechanic-orders")
public class MechanicOrderResource {

    @Autowired
    private TelegramBotService telegramBotService;

    private record CheckoutItem(String materialCode, Integer qty, Long tileId, String title) {}

    private record CheckoutRequest(String orderName, String storageType, List<CheckoutItem> items) {}

    private record CheckoutLine(String materialCode, String title, Integer qty) {}

    private record CheckoutResponse(
        Long orderId,
        String orderName,
        String storageType,
        String mechanicLogin,
        Instant createdAt,
        List<CheckoutLine> lines
    ) {}

    private final InventoryCurrentRepository invRepo;
    private final MechanicOrderRepository orderRepo;
    private final MechanicOrderService mechanicOrderService;
    private final MechanicTileRepository tileRepo;

    public MechanicOrderResource(
        InventoryCurrentRepository invRepo,
        MechanicOrderRepository orderRepo,
        MechanicOrderService mechanicOrderService,
        MechanicTileRepository tileRepo
    ) {
        this.invRepo = invRepo;
        this.orderRepo = orderRepo;
        this.mechanicOrderService = mechanicOrderService;
        this.tileRepo = tileRepo;
    }

    private String currentLogin() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC', 'ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<List<MechanicOrder>> getMyOrders() {
        String login = currentLogin();
        List<MechanicOrder> orders = orderRepo.findByMechanicLoginOrderByCreatedAtDesc(login);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<List<MechanicOrder>> getAllOrders(@RequestParam(name = "mechanic", required = false) String mechanicLogin) {
        List<MechanicOrder> orders;
        if (mechanicLogin != null && !mechanicLogin.isBlank()) {
            orders = orderRepo.findAllWithLinesByLogin(mechanicLogin.trim());
        } else {
            orders = orderRepo.findAllWithLines();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/warehouse/orders")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<List<MechanicOrder>> getAllOrdersForWarehouse() {
        List<MechanicOrder> orders = orderRepo.findAllWithLines();
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{orderId}/complete")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> markAsCompleted(@PathVariable String orderId) {
        mechanicOrderService.markAsCompleted(orderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC', 'ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<?> getOrderLines(@PathVariable String orderId) {
        return orderRepo
            .findByOrderId(orderId)
            .map(order -> ResponseEntity.ok(Map.of("lines", order.getLines())))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/cleanup")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<Void> cleanupOldOrders() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        orderRepo.deleteByCreatedAtBefore(cutoff);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC','ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new BadRequestAlertException("Пустой заказ", "mechanicOrder", "empty");
        }

        // агрегируем по материалу
        Map<String, Integer> requested = new HashMap<>();
        Map<String, String> titles = new HashMap<>();
        for (CheckoutItem it : req.items()) {
            if (it.qty() == null || it.qty() <= 0) continue;
            requested.merge(it.materialCode(), it.qty(), Integer::sum);
            titles.putIfAbsent(it.materialCode(), Optional.ofNullable(it.title()).orElse(it.materialCode()));
        }

        if (requested.isEmpty()) {
            throw new BadRequestAlertException("Пустой заказ", "mechanicOrder", "empty");
        }

        // валидация остатков
        for (var e : requested.entrySet()) {
            var stock = invRepo
                .findByStorageTypeAndMaterial(req.storageType(), e.getKey())
                .map(InventoryCurrent::getAvailableStock)
                .orElse(0);
            if (e.getValue() > stock) {
                throw new BadRequestAlertException("Недостаточно на складе: " + e.getKey(), "mechanicOrder", "not_enough");
            }
        }

        // списываем
        for (var e : requested.entrySet()) {
            var icOpt = invRepo.findByStorageTypeAndMaterial(req.storageType(), e.getKey());
            icOpt.ifPresent(ic -> {
                ic.setAvailableStock(ic.getAvailableStock() - e.getValue());
                invRepo.save(ic);

                String productTitle = titles.getOrDefault(ic.getMaterial(), ic.getMaterial());

                // 🔴 если товар закончился
                if (ic.getAvailableStock() <= 0) {
                    telegramBotService.notifyOutOfStock(ic, productTitle, req.storageType());
                }
                // 🟡 если достигнут минимум, но товар ещё есть
                else {
                    tileRepo
                        .findByMaterialCodeAndActiveTrue(ic.getMaterial())
                        .ifPresent(tile -> {
                            int minAlert = Optional.ofNullable(tile.getMinStockAlert()).orElse(0);
                            if (minAlert > 0 && ic.getAvailableStock() <= minAlert) {
                                telegramBotService.notifyLowStock(ic, productTitle, minAlert);
                            }
                        });
                }
            });
        }

        Long orderId = System.currentTimeMillis();
        String login = currentLogin();
        Instant now = Instant.now();

        List<CheckoutLine> lines = requested
            .entrySet()
            .stream()
            .map(e -> new CheckoutLine(e.getKey(), titles.getOrDefault(e.getKey(), e.getKey()), e.getValue()))
            .collect(Collectors.toList());

        MechanicOrder entity = new MechanicOrder();
        entity.setOrderId(req.orderName());
        entity.setMechanicLogin(login);
        entity.setStorageType(req.storageType());
        entity.setCreatedAt(now);
        entity.setCompleted(false);

        List<MechanicOrderLine> entityLines = lines
            .stream()
            .map(line -> {
                MechanicOrderLine l = new MechanicOrderLine();
                l.setMaterialCode(line.materialCode());
                l.setTitle(line.title());
                l.setQty(line.qty());
                l.setImageUrl(null);
                l.setOrder(entity);
                return l;
            })
            .toList();

        entity.setLines(entityLines);
        orderRepo.save(entity);

        return ResponseEntity.ok(new CheckoutResponse(orderId, req.orderName(), req.storageType(), login, now, lines));
    }
}
