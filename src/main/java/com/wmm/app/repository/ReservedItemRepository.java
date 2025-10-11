package com.wmm.app.repository;

import com.wmm.app.domain.ReservedItem;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservedItemRepository extends JpaRepository<ReservedItem, Long> {
    List<ReservedItem> findByReservedBy(String reservedBy);

    List<ReservedItem> findByReservedAtBefore(Instant threshold);

    List<ReservedItem> findByReservedAtAfter(Instant threshold);

    Optional<ReservedItem> findByMaterialCodeAndReservedBy(String materialCode, String reservedBy);

    @Query(
        """
            select coalesce(sum(r.qty), 0)
            from ReservedItem r
            where r.materialCode = :materialCode
              and r.expiresAt > :now
              and r.reservedBy <> :excludedUser
        """
    )
    int sumActiveByMaterialExcludingUser(
        @Param("materialCode") String materialCode,
        @Param("now") Instant now,
        @Param("excludedUser") String excludedUser
    );
}
