import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      pulsePhase: number;
    }

    const shapes: Shape[] = [];
    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 80 + 30,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002,
        opacity: Math.random() * 0.08 + 0.04,
        type: Math.floor(Math.random() * 3),
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const drawShape = (s: Shape, time: number) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      // Пульсирующий эффект
      const pulse = Math.sin(time * 0.003 + s.pulsePhase) * 0.15 + 0.85;

      ctx.strokeStyle = `rgba(30,144,255,${s.opacity * pulse})`;
      ctx.lineWidth = 2;
      ctx.fillStyle = `rgba(100,180,255,${s.opacity * 0.2 * pulse})`;

      switch (s.type) {
        case 0: {
          // Круг с градиентом
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size / 2);
          grad.addColorStop(0, `rgba(255,255,255,${s.opacity * 0.3})`);
          grad.addColorStop(1, `rgba(30,144,255,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 1: {
          // Квадрат со скошенными углами
          ctx.beginPath();
          const r = s.size / 6;
          ctx.moveTo(-s.size / 2 + r, -s.size / 2);
          ctx.lineTo(s.size / 2 - r, -s.size / 2);
          ctx.quadraticCurveTo(s.size / 2, -s.size / 2, s.size / 2, -s.size / 2 + r);
          ctx.lineTo(s.size / 2, s.size / 2 - r);
          ctx.quadraticCurveTo(s.size / 2, s.size / 2, s.size / 2 - r, s.size / 2);
          ctx.lineTo(-s.size / 2 + r, s.size / 2);
          ctx.quadraticCurveTo(-s.size / 2, s.size / 2, -s.size / 2, s.size / 2 - r);
          ctx.lineTo(-s.size / 2, -s.size / 2 + r);
          ctx.quadraticCurveTo(-s.size / 2, -s.size / 2, -s.size / 2 + r, -s.size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 2: {
          // Шестиугольник
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * (s.size / 2);
            const y = Math.sin(angle) * (s.size / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        default:
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 4, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }

      ctx.restore();
    };

    let frameCount = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach(s => {
        s.x += s.speedX;
        s.y += s.speedY;
        s.rotation += s.rotationSpeed;
        s.pulsePhase += 0.01;

        if (s.x < -s.size) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;

        drawShape(s, frameCount);
      });

      frameCount++;
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
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fcfe 100%)',
      }}
    />
  );
};

export default AnimatedBackground;
