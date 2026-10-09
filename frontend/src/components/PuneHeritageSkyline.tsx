import React from 'react';

interface PuneHeritageSkylineProps {
  className?: string;
  style?: React.CSSProperties;
  opacity?: number;
}

/**
 * Faint Pune Heritage Architecture Silhouette
 * Features:
 * - Sahyadri hills & Sinhagad mountain ridge
 * - Shaniwar Wada Delhi Gate (Dilli Darwaza) bastions, merlons & nagarkhana
 * - Peshwa wada timber balconies, pitched roofs and finials
 * - Fergusson College heritage clock tower & cupola
 * - Parvati Hill temple silhouette
 * Rendered with an ultra-faint gradient mask for peaceful misty atmosphere without obstructing text.
 */
export const PuneHeritageSkyline: React.FC<PuneHeritageSkylineProps> = ({
  className = '',
  style = {},
  opacity = 0.07
}) => {
  return (
    <div
      className={`pune-heritage-skyline-wrapper ${className}`}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '140px',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity,
        transition: 'opacity 0.4s ease',
        ...style
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      >
        <defs>
          {/* Vertical fade to blend seamlessly into soft mist */}
          <linearGradient id="puneSkylineGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#344F1F" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#344F1F" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#4E7830" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#697264" stopOpacity="0.0" />
          </linearGradient>

          {/* Saffron dawn accent highlight */}
          <linearGradient id="puneSaffronGlow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F4991A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F4991A" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 1. Distant Sahyadri / Sinhagad Ridge Line */}
        <path
          d="M 0,130 
             Q 90,110 180,122 
             T 360,115 
             Q 440,95 510,118 
             T 680,120 
             Q 760,105 840,115 
             T 1020,108 
             Q 1110,95 1200,115 
             L 1200,180 L 0,180 Z"
          fill="url(#puneSkylineGrad)"
          opacity="0.5"
        />

        {/* 2. Parvati Hill temple silhouette in distance (Left-Center) */}
        <path
          d="M 120,122 
             L 135,95 L 140,82 L 143,76 L 146,82 L 151,95 L 166,122 Z"
          fill="url(#puneSkylineGrad)"
          opacity="0.6"
        />
        {/* Parvati Temple Flag */}
        <line x1="143" y1="76" x2="143" y2="68" stroke="#344F1F" strokeWidth="1.5" />
        <polygon points="143,68 150,72 143,75" fill="url(#puneSaffronGlow)" opacity="0.8" />

        {/* 3. Shaniwar Wada Delhi Gate (Dilli Darwaza) — Center Left (x: 240 - 460) */}
        {/* Left Semi-circular Bastion (Burj) with crenellations */}
        <path
          d="M 240,180 
             L 240,105 
             L 245,105 L 245,98 L 253,98 L 253,105 
             L 261,105 L 261,98 L 269,98 L 269,105 
             L 277,105 L 277,98 L 285,98 L 285,105 
             L 290,105 L 290,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        {/* Left Bastion curved batter slope */}
        <path d="M 235,180 Q 242,130 248,105 L 290,105 L 290,180 Z" fill="url(#puneSkylineGrad)" opacity="0.7" />

        {/* Central Gateway Arch & Nagarkhana Wooden Pavilion */}
        <path
          d="M 290,180 
             L 290,110 
             L 310,110 
             L 310,88 
             L 305,88 L 305,82 L 395,82 L 395,88 L 390,88 
             L 390,110 
             L 410,110 
             L 410,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        {/* Nagarkhana Pitched Sloping Chhatri Roof & Kalash Finials */}
        <path
          d="M 300,82 
             Q 350,66 400,82 
             L 403,84 L 297,84 Z"
          fill="url(#puneSkylineGrad)"
        />
        <circle cx="350" cy="64" r="2.5" fill="url(#puneSkylineGrad)" />
        <line x1="350" y1="64" x2="350" y2="58" stroke="#344F1F" strokeWidth="1.2" />

        {/* Gateway Arched Portal Silhouette */}
        <path
          d="M 325,180 
             L 325,130 
             Q 350,115 375,130 
             L 375,180 Z"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* Right Semi-circular Bastion with stepped battlements */}
        <path
          d="M 410,180 
             L 410,105 
             L 415,105 L 415,98 L 423,98 L 423,105 
             L 431,105 L 431,98 L 439,98 L 439,105 
             L 447,105 L 447,98 L 455,98 L 455,105 
             L 460,105 L 460,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        <path d="M 465,180 Q 458,130 452,105 L 410,105 L 410,180 Z" fill="url(#puneSkylineGrad)" opacity="0.7" />

        {/* 4. Traditional Peshwa Wada Wooden Gables & Arches (Center: x: 480 - 660) */}
        <path
          d="M 480,180 
             L 480,118 
             L 510,95 L 540,118 
             L 550,118 
             L 575,102 L 600,118 
             L 620,118 
             L 640,90 L 660,118 
             L 660,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        {/* Wada carved window openings */}
        <rect x="495" y="128" width="10" height="16" rx="2" fill="#FFFFFF" opacity="0.3" />
        <rect x="520" y="128" width="10" height="16" rx="2" fill="#FFFFFF" opacity="0.3" />
        <rect x="565" y="128" width="10" height="16" rx="2" fill="#FFFFFF" opacity="0.3" />
        <rect x="625" y="128" width="12" height="18" rx="2" fill="#FFFFFF" opacity="0.3" />

        {/* 5. Fergusson College Gothic-Colonial Stone Clock Tower (Right-Center: x: 710 - 820) */}
        {/* Main college stone facade */}
        <rect x="680" y="125" width="170" height="55" fill="url(#puneSkylineGrad)" />
        {/* Central Tower */}
        <path
          d="M 740,180 
             L 740,82 
             L 735,82 L 735,76 L 775,76 L 775,82 L 770,82 
             L 770,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        {/* Clock Tower Gothic Steeple / Pyramidal Spire */}
        <polygon points="736,76 755,38 774,76" fill="url(#puneSkylineGrad)" />
        {/* Tower Clock Face */}
        <circle cx="755" cy="98" r="7" fill="#FFFFFF" opacity="0.4" />
        {/* Spire Finial */}
        <line x1="755" y1="38" x2="755" y2="30" stroke="#344F1F" strokeWidth="1.5" />

        {/* 6. Vishrambaug Wada Courtyard Balconies & Pillars (Right: x: 860 - 1050) */}
        <path
          d="M 860,180 
             L 860,115 
             L 875,100 L 920,100 L 935,115 
             L 960,115 
             L 975,104 L 1010,104 L 1025,115 
             L 1050,115 
             L 1050,180 Z"
          fill="url(#puneSkylineGrad)"
        />
        {/* Carved archway jharokhas */}
        <path d="M 885,125 Q 898,112 911,125 L 911,142 L 885,142 Z" fill="#FFFFFF" opacity="0.3" />
        <path d="M 980,125 Q 993,112 1006,125 L 1006,142 L 980,142 Z" fill="#FFFFFF" opacity="0.3" />

        {/* 7. Sinhagad Killa Bastion on the far hill slope (x: 1060 - 1200) */}
        <path
          d="M 1060,180 
             L 1060,122 
             Q 1110,105 1160,110 
             L 1160,95 L 1175,95 L 1175,112 
             L 1200,115 
             L 1200,180 Z"
          fill="url(#puneSkylineGrad)"
        />
      </svg>
    </div>
  );
};

export default PuneHeritageSkyline;
