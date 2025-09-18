package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.MechanicOrder;
import com.wmm.app.domain.MechanicTile;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.MechanicOrderRepository;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.service.dto.MechanicOrderDTO;
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

    public MechanicOrderService(MechanicTileRepository tileRepo, InventoryCurrentRepository invRepo, MechanicOrderRepository orderRepo) {
        this.tileRepo = tileRepo;
        this.invRepo = invRepo;
        this.orderRepo = orderRepo;
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
    }
}
