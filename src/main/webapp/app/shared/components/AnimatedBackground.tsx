import React, { useEffect, useRef } from 'react';

/**
 * Анимированный фон с движущимися геометрическими фигурами.
 * Используется в витринах механика, кладовщика и старшего кладовщика.
 */
const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();
    window.addEventListener('resize', resize);

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

    const shapes: Shape[] = [];
    for (let i = 0; i < 20; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 60 + 20,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.003,
        opacity: Math.random() * 0.1 + 0.05,
        type: Math.floor(Math.random() * 3),
      });
    }

    const drawShape = (s: Shape) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      ctx.strokeStyle = `rgba(30,144,255,${s.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = `rgba(120,190,255,${s.opacity * 0.3})`;

      switch (s.type) {
        case 0:
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          break;
        case 1:
          ctx.beginPath();
          ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
          break;
        case 2:
          ctx.beginPath();
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, s.size / 2);
          ctx.lineTo(-s.size / 2, s.size / 2);
          ctx.closePath();
          break;
        default:
          // если тип не распознан — просто нарисуем маленький круг
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 4, 0, Math.PI * 2);
          break;
      }

      ctx.stroke();
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapes.forEach(s => {
        s.x += s.speedX;
        s.y += s.speedY;
        s.rotation += s.rotationSpeed;

        if (s.x < -s.size) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;

        drawShape(s);
      });
      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e8f4fd 50%, #f5faff 100%)',
      }}
    />
  );
};

export default AnimatedBackground;
