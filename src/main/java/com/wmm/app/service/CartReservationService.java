package com.wmm.app.service;

import com.wmm.app.domain.ReservedItem;
import com.wmm.app.repository.ReservedItemRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class CartReservationService {

    private final ReservedItemRepository reservedItemRepository;

    public CartReservationService(ReservedItemRepository reservedItemRepository) {
        this.reservedItemRepository = reservedItemRepository;
    }

    /**
     * Резервирует материал для пользователя.
     */
    public ReservedItem reserveItem(String materialCode, int qty, String reservedBy, String storageType) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(1, ChronoUnit.MINUTES); // 🕒 тестовая минута

        ReservedItem item = reservedItemRepository.findByMaterialCodeAndReservedBy(materialCode, reservedBy).orElseGet(ReservedItem::new);

        item.setMaterialCode(materialCode);
        item.setQty(qty);
        item.setReservedBy(reservedBy);
        item.setReservedAt(now);
        item.setExpiresAt(expiresAt);
        item.setStorageType(storageType);

        return reservedItemRepository.save(item);
    }

    /**
     * Удаляет резерв конкретного материала.
     */
    public void releaseItem(String materialCode, String user) {
        reservedItemRepository.findByMaterialCodeAndReservedBy(materialCode, user).ifPresent(reservedItemRepository::delete);
    }

    /**
     * Очищает все резервы пользователя.
     */
    public void releaseAll(String user) {
        reservedItemRepository.findByReservedBy(user).forEach(reservedItemRepository::delete);
    }

    /**
     * Продлевает жизнь всех резервов пользователя.
     */
    public void extendReservations(String user) {
        Instant now = Instant.now();
        Instant newExpiry = now.plus(1, ChronoUnit.MINUTES); // 🕒 тестовая минута

        reservedItemRepository
            .findByReservedBy(user)
            .forEach(r -> {
                if (r.getExpiresAt() != null && r.getExpiresAt().isAfter(now)) {
                    r.setExpiresAt(newExpiry);
                    reservedItemRepository.save(r);
                }
            });
    }

    /**
     * Возвращает активные резервы пользователя (и очищает старые).
     */
    public List<ReservedItem> getActiveReservations(String user) {
        Instant now = Instant.now();

        // очистка протухших резервов
        reservedItemRepository.findByReservedAtBefore(now.minus(1, ChronoUnit.HOURS)).forEach(reservedItemRepository::delete);

        return reservedItemRepository
            .findByReservedBy(user)
            .stream()
            .filter(r -> r.getExpiresAt() != null && r.getExpiresAt().isAfter(now))
            .toList();
    }
}
