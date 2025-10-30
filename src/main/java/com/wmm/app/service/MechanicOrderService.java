package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.MechanicOrder;
import com.wmm.app.domain.MechanicOrderLine;
import com.wmm.app.domain.MechanicTile;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryVisiblePerStorageRepository;
import com.wmm.app.repository.MechanicOrderRepository;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.service.dto.MechanicOrderDTO;
import com.wmm.app.service.dto.MechanicOrderLineDTO;
import com.wmm.app.service.dto.MechanicOrderResponseDTO;
import com.wmm.app.web.rest.errors.BadRequestAlertException;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MechanicOrderService {

    private final MechanicTileRepository tileRepo;
    private final InventoryCurrentRepository invRepo;
    private final MechanicOrderRepository orderRepo;
    private final InventoryVisiblePerStorageService visiblePerStorageService;
    private final TelegramBotService telegramBotService;
    private final InventoryVisiblePerStorageRepository visiblePerStorageRepo;

    public MechanicOrderService(
        MechanicTileRepository tileRepo,
        InventoryCurrentRepository invRepo,
        MechanicOrderRepository orderRepo,
        InventoryVisiblePerStorageService visiblePerStorageService,
        TelegramBotService telegramBotService,
        InventoryVisiblePerStorageRepository visiblePerStorageRepo
    ) {
        this.tileRepo = tileRepo;
        this.invRepo = invRepo;
        this.orderRepo = orderRepo;
        this.visiblePerStorageService = visiblePerStorageService;
        this.telegramBotService = telegramBotService;
        this.visiblePerStorageRepo = visiblePerStorageRepo;
    }

    public MechanicOrderResponseDTO confirm(String mechanicLogin, MechanicOrderDTO req) {
        if (req.getLines() == null || req.getLines().isEmpty()) {
            throw new BadRequestAlertException("error.empty", "mechanicOrder", "empty");
        }

        // 1) валидация остатков
        for (MechanicOrderDTO.Line l : req.getLines()) {
            InventoryCurrent inv = invRepo
                .findByStorageTypeAndMaterial(req.getStorageType(), l.getMaterial())
                .orElseThrow(() -> new BadRequestAlertException("error.not_found", "inventory", l.getMaterial()));
            if (inv.getAvailableStock() < l.getQty()) {
                throw new BadRequestAlertException("error.not_enough", "inventory", l.getMaterial());
            }
        }

        // 2) списание
        for (MechanicOrderDTO.Line l : req.getLines()) {
            InventoryCurrent inv = invRepo.findByStorageTypeAndMaterial(req.getStorageType(), l.getMaterial()).orElseThrow();
            inv.setAvailableStock(inv.getAvailableStock() - l.getQty());
            invRepo.save(inv);
            visiblePerStorageService.recalculate(req.getStorageType(), l.getMaterial());
        }

        // 3) сбор ответа
        List<MechanicOrderResponseDTO.Line> outLines = new ArrayList<>();
        for (MechanicOrderDTO.Line l : req.getLines()) {
            MechanicTile tile = tileRepo.findById(l.getTileId()).orElse(null);

            MechanicOrderResponseDTO.Line out = new MechanicOrderResponseDTO.Line();
            out.setTileId(l.getTileId());
            out.setMaterialCode(l.getMaterial());
            out.setQty(l.getQty());
            if (tile != null) {
                out.setTitle(tile.getTitle());
                out.setImageUrl(tile.getImageUrl());
            }
            outLines.add(out);
        }

        MechanicOrderResponseDTO resp = new MechanicOrderResponseDTO();
        resp.setOrderId(req.getOrderId());
        resp.setStorageType(req.getStorageType());
        resp.setMechanic(mechanicLogin);
        resp.setCreatedAt(Instant.now());
        resp.setLines(outLines);
        return resp;
    }

    public void markAsCompleted(String orderId) {
        MechanicOrder order = orderRepo
            .findByOrderId(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + orderId));

        order.setCompleted(true);
        orderRepo.save(order);

        if (order.getLines() != null) {
            for (var line : order.getLines()) {
                if (line.getQty() <= 0) continue;

                invRepo
                    .findByStorageTypeAndMaterial(order.getStorageType(), line.getMaterialCode())
                    .ifPresent(inv -> {
                        inv.setAvailableStock(inv.getAvailableStock() - line.getQty());
                        invRepo.save(inv);
                    });

                visiblePerStorageService.recalculate(order.getStorageType(), line.getMaterialCode());
            }
        }
    }

    public void cancelOrder(String orderId) {
        MechanicOrder order = orderRepo
            .findByOrderId(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + orderId));

        order.setCompleted(true); // чтобы скрылась с активных заявок
        order.setCancelled(true); // чтобы отметить как удалённую
        orderRepo.save(order);

        // Пересчитать видимые остатки, т.к. резервация отменяется
        if (order.getLines() != null) {
            order
                .getLines()
                .stream()
                .map(MechanicOrderLine::getMaterialCode)
                .distinct()
                .forEach(mat -> visiblePerStorageService.recalculate(order.getStorageType(), mat));
        }
    }

    @Transactional
    public void updateLineQtyOrDelete(String orderId, String materialCode, Integer newQty) {
        MechanicOrder order = orderRepo
            .findByOrderId(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + orderId));

        List<MechanicOrderLine> lines = order.getLines();
        MechanicOrderLine line = lines
            .stream()
            .filter(l -> l.getMaterialCode().equals(materialCode))
            .findFirst()
            .orElseThrow(() -> new EntityNotFoundException("Позиция не найдена: " + materialCode));

        if (newQty == null || newQty <= 0) {
            // Удалить строку
            lines.remove(line);
        } else if (newQty < line.getQty()) {
            // Уменьшить количество
            line.setQty(newQty);
        } else {
            throw new BadRequestAlertException("Нельзя увеличить количество", "mechanicOrder", "invalid_qty");
        }

        // Если заявка теперь пустая — отменяем
        if (lines.isEmpty()) {
            order.setCompleted(true);
            order.setCancelled(true);
        }

        orderRepo.save(order);

        // Пересчёт видимых остатков
        visiblePerStorageService.recalculate(order.getStorageType(), materialCode);
    }

    @Transactional
    public void updateOrderLines(String orderId, List<MechanicOrderLineDTO> lines) {
        MechanicOrder order = orderRepo
            .findByOrderId(orderId)
            .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена: " + orderId));

        // Получаем ссылку на текущий список
        List<MechanicOrderLine> existingLines = order.getLines();
        existingLines.clear(); // безопасно удалить все элементы — Hibernate отследит orphanRemoval

        // Добавляем новые строки
        for (MechanicOrderLineDTO dto : lines) {
            MechanicOrderLine line = new MechanicOrderLine();
            line.setMaterialCode(dto.getMaterialCode());
            line.setQty(dto.getQty());
            line.setTitle(dto.getTitle());
            line.setOrder(order);
            existingLines.add(line); // добавляем в существующий список
        }

        orderRepo.save(order);

        // Пересчитываем видимые остатки
        lines
            .stream()
            .map(MechanicOrderLineDTO::getMaterialCode)
            .distinct()
            .forEach(mat -> visiblePerStorageService.recalculate(order.getStorageType(), mat));
    }
}
