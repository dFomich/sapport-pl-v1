package com.wmm.app.repository;

import com.wmm.app.domain.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {}
