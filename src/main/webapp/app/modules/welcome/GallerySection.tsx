import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Box, Container, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './gallery-section.scss';

interface GalleryItem {
  id: number;
  imageUrl: string;
}

const GallerySection = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axios.get<GalleryItem[]>('/api/gallery').then(res => setImages(res.data));
  }, []);

  // Очистка autoplay при изменении index или isAutoPlay
  useEffect(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
    }

    if (isAutoPlay && images.length > 0) {
      autoplayRef.current = setTimeout(() => {
        setPrevIndex(index);
        setIndex(prev => (prev + 1) % images.length);
      }, 5000); // меняем каждые 5 секунд
    }

    return () => {
      if (autoplayRef.current) {
        clearTimeout(autoplayRef.current);
      }
    };
  }, [index, isAutoPlay, images.length]);

  const goToSlide = (i: number) => {
    setPrevIndex(index);
    setIndex(i);
    setIsAutoPlay(true);
  };

  const goToPrev = () => {
    setPrevIndex(index);
    setIndex(prev => (prev - 1 + images.length) % images.length);
    setIsAutoPlay(true);
  };

  const goToNext = () => {
    setPrevIndex(index);
    setIndex(prev => (prev + 1) % images.length);
    setIsAutoPlay(true);
  };

  const handleMouseEnter = () => {
    setIsAutoPlay(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlay(true);
  };

  if (images.length === 0) return null;

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3, color: '#2f3542' }}>
        Галерея
      </Typography>

      <Box className="gallery-wrapper" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Контейнер слайдов */}
        <Box className="gallery-container">
          {images.map((img, i) => (
            <Box
              key={img.id}
              component="img"
              src={img.imageUrl}
              alt={`slide-${i}`}
              className={`gallery-slide ${i === index ? 'active' : ''} ${i === prevIndex ? 'previous' : ''}`}
            />
          ))}
        </Box>

        {/* Градиент поверх изображения */}
        <Box className="gallery-overlay" />

        {/* Левая стрелка */}
        <IconButton
          className="gallery-arrow gallery-arrow-left"
          onClick={goToPrev}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            '@media (max-width: 600px)': {
              left: 8,
              width: 36,
              height: 36,
            },
          }}
        >
          <ChevronLeft sx={{ fontSize: '28px' }} />
        </IconButton>

        {/* Правая стрелка */}
        <IconButton
          className="gallery-arrow gallery-arrow-right"
          onClick={goToNext}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-50%) scale(1.1)',
            },
            '@media (max-width: 600px)': {
              right: 8,
              width: 36,
              height: 36,
            },
          }}
        >
          <ChevronRight sx={{ fontSize: '28px' }} />
        </IconButton>

        {/* Счетчик слайдов */}
        <Box
          className="gallery-counter"
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            px: 2,
            py: 0.75,
            borderRadius: 2,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {index + 1} / {images.length}
        </Box>

        {/* Точки навигации */}
        <Box className="gallery-dots">
          {images.map((_, i) => (
            <Box
              key={i}
              className={`dot ${i === index ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  goToSlide(i);
                }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default GallerySection;
