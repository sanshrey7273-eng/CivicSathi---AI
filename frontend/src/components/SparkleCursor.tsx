import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialSize: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'star' | 'dot' | 'sparkle';
}

// Forest green and golden saffron brand palette
const SPARKLE_COLORS = [
  '#344F1F', // Forest green
  '#4E7830', // Sage green
  '#F4991A', // Pune saffron
  '#FFB84D', // Warm saffron gold
  '#E6A020', // Golden amber
  '#FFF4DE', // Morning ivory dawn shimmer
];

export const SparkleCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // 2. Disable on touch / coarse pointer devices
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches ||
      (!window.matchMedia('(pointer: fine)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    if (isTouch) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let particles: Particle[] = [];
    let lastX = -100;
    let lastY = -100;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Helper to spawn a single sparkle particle
    const createParticle = (x: number, y: number, isBurst = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = isBurst ? Math.random() * 2.4 + 0.6 : Math.random() * 0.75 + 0.2;
      const size = isBurst ? Math.random() * 3 + 2.2 : Math.random() * 2.2 + 1.2;
      const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
      const shapes: ('star' | 'dot' | 'sparkle')[] = ['star', 'sparkle', 'dot'];
      const shape = isBurst
        ? (Math.random() > 0.35 ? 'star' : 'sparkle')
        : shapes[Math.floor(Math.random() * shapes.length)];

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isBurst ? 0.35 : 0.1), // gentle upward buoyant drift
        size,
        initialSize: size,
        color,
        alpha: 1,
        decay: isBurst ? Math.random() * 0.024 + 0.02 : Math.random() * 0.035 + 0.025,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        shape
      };
    };

    // Draw an elegant 4-point sparkle star
    const drawSparkle = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      alpha: number
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.globalAlpha = Math.max(0, alpha);
      context.fillStyle = color;

      context.beginPath();
      const r = size;
      const inner = size * 0.26;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        context.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        const aNext = a + Math.PI / 4;
        context.lineTo(Math.cos(aNext) * inner, Math.sin(aNext) * inner);
      }
      context.closePath();
      context.fill();

      // Subtle warm center pinhead glow
      context.beginPath();
      context.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      context.fillStyle = '#FFFFFF';
      context.globalAlpha = Math.max(0, alpha * 0.85);
      context.fill();

      context.restore();
    };

    // Main animation step
    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= p.decay;
        p.size = p.initialSize * (p.alpha > 0 ? p.alpha : 0);

        if (p.alpha <= 0 || p.size <= 0.2) {
          particles.splice(i, 1);
          continue;
        }

        if (p.shape === 'star' || p.shape === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      // Only schedule next frame if there are active particles
      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
      }
    };

    const startAnimationIfNeeded = () => {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Track mouse movement: only spawns when moving > 5px, no continuous particles when idle
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        lastX = e.clientX;
        lastY = e.clientY;

        if (particles.length < 50) {
          particles.push(createParticle(e.clientX, e.clientY, false));
          if (dist > 18) {
            // Add a mid-point particle for smooth trail during brisk mouse motion
            particles.push(createParticle(e.clientX - dx * 0.5, e.clientY - dy * 0.5, false));
          }
        }

        startAnimationIfNeeded();
      }
    };

    // Click burst: creates small, elegant burst of 8-12 particles on click
    const onMouseDown = (e: MouseEvent) => {
      const burstCount = Math.floor(Math.random() * 4) + 8;
      for (let i = 0; i < burstCount; i++) {
        if (particles.length < 75) {
          particles.push(createParticle(e.clientX, e.clientY, true));
        }
      }
      startAnimationIfNeeded();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999,
        background: 'transparent'
      }}
      aria-hidden="true"
    />
  );
};

export default SparkleCursor;
