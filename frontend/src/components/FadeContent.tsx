import React, { useEffect, useRef, useState } from 'react';

export interface FadeContentProps {
  children: React.ReactNode;
  blur?: boolean;
  duration?: number;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = '',
  style = {}
}) => {
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

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
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, prefersReducedMotion]);

  const transitionStyle = prefersReducedMotion
    ? 'none'
    : `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s${
        blur ? `, filter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` : ''
      }`;

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: inView ? 1 : initialOpacity,
        transform: inView ? 'translateY(0)' : 'translateY(12px)',
        filter: inView ? 'blur(0px)' : blur ? 'blur(6px)' : 'none',
        transition: transitionStyle,
        willChange: prefersReducedMotion ? 'auto' : 'opacity, transform, filter',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default FadeContent;
