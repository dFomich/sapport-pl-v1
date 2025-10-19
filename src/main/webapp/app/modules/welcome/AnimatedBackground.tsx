// src/main/webapp/app/modules/welcome/AnimatedBackground.tsx
import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface Shape {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Инициализация фигур
    if (shapesRef.current.length === 0) {
      for (let i = 0; i < 18; i++) {
        shapesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 60 + 40,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: (Math.random() - 0.5) * 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.006,
          opacity: Math.random() * 0.25 + 0.3,
          type: Math.floor(Math.random() * 3),
        });
      }
    }

    // Функция отрисовки фигуры
    const drawShape = (shape: Shape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);

      // Простое свечение через двойную обводку
      ctx.strokeStyle = `rgba(100, 180, 255, ${shape.opacity * 0.3})`;
      ctx.lineWidth = 6;

      // Внешний контур (свечение)
      switch (shape.type) {
        case 0:
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 1:
          ctx.beginPath();
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
          ctx.stroke();
          break;
        case 2:
          ctx.beginPath();
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.closePath();
          ctx.stroke();
          break;
        default:
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }

      // Основной контур
      ctx.strokeStyle = `rgba(30, 144, 255, ${shape.opacity})`;
      ctx.lineWidth = 3;
      ctx.fillStyle = `rgba(120, 190, 255, ${shape.opacity * 0.3})`;

      switch (shape.type) {
        case 0: // Круг
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          break;
        case 1: // Квадрат
          ctx.beginPath();
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
          ctx.stroke();
          ctx.fill();
          break;
        case 2: // Треугольник
          ctx.beginPath();
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
          break;
        default:
          // Круг по умолчанию
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    // Функция отрисовки линий между близкими фигурами
    const drawConnections = () => {
      const shapes = shapesRef.current;
      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const dx = shapes[i].x - shapes[j].x;
          const dy = shapes[i].y - shapes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(70, 160, 255, ${0.4 * (1 - distance / 200)})`;
            ctx.lineWidth = 2;
            ctx.moveTo(shapes[i].x, shapes[i].y);
            ctx.lineTo(shapes[j].x, shapes[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Анимация
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем линии
      drawConnections();

      // Обновляем и рисуем фигуры
      shapesRef.current.forEach(shape => {
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        shape.rotation += shape.rotationSpeed;

        // Границы экрана
        if (shape.x < -shape.size) shape.x = canvas.width + shape.size;
        if (shape.x > canvas.width + shape.size) shape.x = -shape.size;
        if (shape.y < -shape.size) shape.y = canvas.height + shape.size;
        if (shape.y > canvas.height + shape.size) shape.y = -shape.size;

        drawShape(shape);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Интерактивность с мышью
    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      shapesRef.current.forEach(shape => {
        const dx = mouseX - shape.x;
        const dy = mouseY - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          shape.x -= dx * 0.008;
          shape.y -= dy * 0.008;
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: 'linear-gradient(135deg, #d4e7f7 0%, #e8f4fd 50%, #cfe3f5 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default AnimatedBackground;
