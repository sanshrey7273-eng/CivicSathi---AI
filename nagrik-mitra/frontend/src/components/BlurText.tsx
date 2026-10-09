import React, { useEffect, useRef, useState } from 'react';

export interface BlurTextProps {
  text: string;
  delay?: number;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 120,
  animateBy = 'words',
  direction = 'top',
  className = '',
  style = {},
  onAnimationComplete
}) => {
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const items = animateBy === 'words' ? text.split(' ') : text.split('');

  useEffect(() => {
    if (inView && onAnimationComplete) {
      const totalDuration = items.length * delay + 400;
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  }, [inView, items.length, delay, onAnimationComplete]);

  return (
    <h1
      ref={containerRef}
      className={className}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: animateBy === 'words' ? '0.3em' : '0.02em',
        ...style
      }}
    >
      {items.map((item, index) => {
        const itemDelay = prefersReducedMotion ? 0 : index * delay;
        const translateY = direction === 'top' ? '-10px' : '10px';

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              transition: prefersReducedMotion
                ? 'none'
                : `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${itemDelay}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${itemDelay}ms, filter 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${itemDelay}ms`,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : `translateY(${translateY})`,
              filter: inView ? 'blur(0px)' : 'blur(6px)',
              willChange: prefersReducedMotion ? 'auto' : 'transform, opacity, filter'
            }}
          >
            {item}
          </span>
        );
      })}
    </h1>
  );
};

export default BlurText;
