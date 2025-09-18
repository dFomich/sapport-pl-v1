package com.wmm.app.repository;

import com.wmm.app.domain.MechanicOrderLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MechanicOrderLineRepository extends JpaRepository<MechanicOrderLine, Long> {}
