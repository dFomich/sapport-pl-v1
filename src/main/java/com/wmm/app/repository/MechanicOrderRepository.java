package com.wmm.app.repository;

import com.wmm.app.domain.MechanicOrder;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MechanicOrderRepository extends JpaRepository<MechanicOrder, String> {
    List<MechanicOrder> findByMechanicLogin(String mechanicLogin);

    @EntityGraph(attributePaths = "lines")
    List<MechanicOrder> findByMechanicLoginOrderByCreatedAtDesc(String mechanicLogin);

    @EntityGraph(attributePaths = "lines")
    Optional<MechanicOrder> findByOrderId(String orderId);

    @Query("SELECT o FROM MechanicOrder o LEFT JOIN FETCH o.lines ORDER BY o.createdAt DESC")
    List<MechanicOrder> findAllWithLines();

    List<MechanicOrder> findByCompletedAndCancelled(boolean completed, boolean cancelled);

    @Query(
        "SELECT o FROM MechanicOrder o LEFT JOIN FETCH o.lines WHERE LOWER(o.mechanicLogin) LIKE LOWER(CONCAT('%', :loginPart, '%')) ORDER BY o.createdAt DESC"
    )
    List<MechanicOrder> findAllWithLinesByLogin(@Param("loginPart") String loginPart);

    void deleteByCreatedAtBefore(Instant cutoffDate);

    // ✅ ДОБАВЬТЕ ЭТИ СТРОКИ:
    @Query(
        "SELECT o FROM MechanicOrder o LEFT JOIN FETCH o.lines WHERE o.createdAt >= :from AND o.createdAt <= :to ORDER BY o.createdAt DESC"
    )
    List<MechanicOrder> findOrdersInRangeWithLines(@Param("from") Instant from, @Param("to") Instant to);
}
