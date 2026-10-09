import React, { useEffect, useRef } from 'react';
import { PuneHeritageSkyline } from './PuneHeritageSkyline';

export const HeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.offsetWidth || 600;
      canvas.height = canvas.parentElement?.offsetHeight || 300;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Subtle civic mist dew droplets in sage-green and saffron dawn
    const nodeCount = 20;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * (canvas.width || 600),
      y: Math.random() * (canvas.height || 300),
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 2 + 1.2,
      color: Math.random() > 0.45 ? 'rgba(52, 79, 31, 0.07)' : 'rgba(244, 153, 26, 0.1)'
    }));

    if (mediaQuery.matches) {
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });
      return () => window.removeEventListener('resize', resize);
    }

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connect nearby nodes with ultra-faint filaments resembling morning mist threads
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 105) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(52, 79, 31, ${0.04 * (1 - dist / 105)})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Draw and gently wander nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* 1. Slow-moving sage-green morning mist pool */}
      <div
        className="pune-fog-pool-sage"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '75%',
          height: '110%',
          background: 'radial-gradient(ellipse 65% 55% at 30% 40%, rgba(142, 172, 132, 0.16), transparent 70%)',
          filter: 'blur(32px)',
          pointerEvents: 'none'
        }}
      />

      {/* 2. Gentle warm saffron sunrise morning glow */}
      <div
        className="pune-fog-pool-saffron"
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '65%',
          height: '100%',
          background: 'radial-gradient(ellipse 60% 50% at 75% 35%, rgba(244, 153, 26, 0.09), transparent 70%)',
          filter: 'blur(28px)',
          pointerEvents: 'none'
        }}
      />

      {/* 3. Subtle horizontal mist ribbon */}
      <div
        className="pune-fog-ribbon"
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '10%',
          right: '10%',
          height: '70px',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 252, 245, 0.55), transparent 75%)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }}
      />

      {/* 4. Canvas for delicate drifting dew nodes */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.85
        }}
      />

      {/* 5. Faint Pune Heritage Architecture Silhouette along the base */}
      <PuneHeritageSkyline opacity={0.075} />
    </div>
  );
};

export default HeroBackground;
