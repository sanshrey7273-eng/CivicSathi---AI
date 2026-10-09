import React from 'react';

/**
 * MistyPuneBackground
 * Creates a serene, atmospheric "Misty Pune / Soft Fog" visual environment:
 * - Subtle, slow-moving translucent fog layers using lightweight CSS gradients and blur.
 * - Soft sage-green morning mist from the Western Ghats / Sahyadri hills.
 * - Gentle warm saffron sunrise morning glow.
 * - Keeps cards, forms, maps and tables crisp, readable, and high-contrast.
 * - Respects prefers-reduced-motion and consumes minimal CPU.
 */
export const MistyPuneBackground: React.FC = () => {
  return (
    <div
      className="pune-mist-environment"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Layer 1: Soft sage-green morning mist (Western Ghats breeze drifting from left) */}
      <div
        className="pune-fog-drift-sage"
        style={{
          position: 'absolute',
          top: '5%',
          left: '-8%',
          width: '55vw',
          height: '60vh',
          background: 'radial-gradient(ellipse 65% 55% at 40% 45%, rgba(142, 172, 132, 0.12), transparent 72%)',
          filter: 'blur(45px)',
          pointerEvents: 'none'
        }}
      />

      {/* Layer 2: Gentle warm saffron morning light (Sunrise glow drifting from upper-right) */}
      <div
        className="pune-fog-drift-saffron"
        style={{
          position: 'absolute',
          top: '-6%',
          right: '-5%',
          width: '50vw',
          height: '55vh',
          background: 'radial-gradient(ellipse 60% 50% at 65% 35%, rgba(244, 153, 26, 0.065), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Layer 3: Soft valley mist ribbon near the middle-lower page */}
      <div
        className="pune-fog-drift-valley"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '15%',
          width: '70vw',
          height: '45vh',
          background: 'radial-gradient(ellipse 70% 45% at 50% 60%, rgba(184, 204, 175, 0.08), transparent 75%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default MistyPuneBackground;
