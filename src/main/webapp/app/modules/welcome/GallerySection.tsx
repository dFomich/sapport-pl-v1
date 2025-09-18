// GallerySection.tsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Box, Container, Typography } from '@mui/material';
import './gallery-section.scss';

interface GalleryItem {
  id: number;
  imageUrl: string;
}

const GallerySection = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    axios.get<GalleryItem[]>('/api/gallery').then(res => setImages(res.data));
  }, []);

  useEffect(() => {
    if (!paused && images.length > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setPaused(false); // ⬅️ убираем паузу
        setIndex(prev => (prev + 1) % images.length); // ⬅️ принудительно перелистываем
      }, 7000); // ⬅️ после нажатия на кружок
    }
    return () => window.clearTimeout(timeoutRef.current);
  }, [index, paused, images]);

  const handleDotClick = (i: number) => {
    setIndex(i);
    setPaused(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setPaused(false), 7000);
  };

  if (images.length === 0) return null;

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: '#2f3542' }}>
        Галерея
      </Typography>
      <Box className="gallery-frame">
        <Box className="gallery-slide-container">
          {images.map((img, i) => (
            <Box
              key={img.id}
              component="img"
              src={img.imageUrl}
              alt={`slide-${i}`}
              className={`gallery-image ${i === index ? 'active' : ''}`}
            />
          ))}
        </Box>
      </Box>
      <Box className="gallery-dots">
        {images.map((_, i) => (
          <Box key={i} className={`dot ${i === index ? 'active' : ''}`} onClick={() => handleDotClick(i)} />
        ))}
      </Box>
    </Container>
  );
};

export default GallerySection;
