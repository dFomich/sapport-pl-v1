package com.wmm.app.repository;

import com.wmm.app.domain.ProductGroup;
import com.wmm.app.domain.ProductGroupLink;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductGroupLinkRepository extends JpaRepository<ProductGroupLink, Long> {
    List<ProductGroupLink> findByGroup(ProductGroup group);
    List<ProductGroupLink> findByGroupId(Long groupId);
}
