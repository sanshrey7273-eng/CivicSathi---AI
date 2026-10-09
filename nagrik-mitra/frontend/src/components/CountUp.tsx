import React, { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  separator?: string;
  direction?: 'up' | 'down';
  className?: string;
  style?: React.CSSProperties;
  startWhen?: boolean;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.5,
  separator = '',
  direction = 'up',
  className = '',
  style = {},
  startWhen = true
}) => {
  const [currentValue, setCurrentValue] = useState<number>(from);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState<boolean>(false);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setCurrentValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current && startWhen) {
          setInView(true);
          hasAnimatedRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [to, startWhen]);

  useEffect(() => {
    if (!inView) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startVal = direction === 'down' ? to : from;
    const endVal = direction === 'down' ? from : to;
    const totalMs = duration * 1000;

    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / totalMs, 1);
      const easedProgress = easeOutCubic(progress);

      const nextVal = Math.round(startVal + (endVal - startVal) * easedProgress);
      setCurrentValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [inView, from, to, duration, direction]);

  const formattedValue = separator
    ? currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : currentValue.toString();

  return (
    <span ref={elementRef} className={className} style={style}>
      {formattedValue}
    </span>
  );
};

export default CountUp;
