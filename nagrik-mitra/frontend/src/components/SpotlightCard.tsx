import React, { useRef, useState } from 'react';

export interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  as?: 'button' | 'div';
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(244, 153, 26, 0.16)',
  style = {},
  onClick,
  type = 'button',
  as = 'div'
}) => {
  const cardRef = useRef<HTMLDivElement | HTMLButtonElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const Component = as as any;

  return (
    <Component
      ref={cardRef as any}
      type={as === 'button' ? type : undefined}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Dynamic Radial Spotlight Layer */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          opacity,
          transition: 'opacity 0.25s ease',
          background: `radial-gradient(180px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
          zIndex: 1
        }}
      />
      {/* Content wrapper to stay above spotlight */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {children}
      </div>
    </Component>
  );
};

export default SpotlightCard;
