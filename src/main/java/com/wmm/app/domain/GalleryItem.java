package com.wmm.app.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "gallery_item")
public class GalleryItem implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "caption")
    private String caption;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    // === Геттеры и сеттеры ===

    public Long getId() {
        return id;
    }

    public GalleryItem setId(Long id) {
        this.id = id;
        return this;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public GalleryItem setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        return this;
    }

    public String getCaption() {
        return caption;
    }

    public GalleryItem setCaption(String caption) {
        this.caption = caption;
        return this;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public GalleryItem setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
        return this;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public GalleryItem setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
        return this;
    }
}
