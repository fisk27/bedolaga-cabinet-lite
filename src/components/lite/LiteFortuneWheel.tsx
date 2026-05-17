import { useEffect, useRef, useState, memo } from 'react';
import type { WheelPrize } from '../../api/wheel';

interface LiteFortuneWheelProps {
  prizes: WheelPrize[];
  isSpinning: boolean;
  targetRotation: number | null;
  onSpinComplete: () => void;
}

const SPARKLE_POSITIONS = Array.from({ length: 8 }, (_, i) => ({
  top: `${20 + ((i * 10) % 60)}%`,
  left: `${15 + ((i * 13) % 70)}%`,
  delay: `${i * 0.15}s`,
}));

const LITE_SECTOR_COLORS = [
  '#FFD700',
  '#1F1B12',
  '#FFE352',
  '#2A2418',
  '#E6BE00',
  '#16130D',
  '#FFCF40',
  '#23201A',
];

const LiteFortuneWheel = memo(function LiteFortuneWheel({
  prizes,
  isSpinning,
  targetRotation,
  onSpinComplete,
}: LiteFortuneWheelProps) {
  const wheelRef = useRef<SVGGElement>(null);
  const accumulatedRotation = useRef(0);
  const [displayRotation, setDisplayRotation] = useState(0);

  useEffect(() => {
    if (isSpinning && targetRotation !== null && wheelRef.current) {
      const currentPos = accumulatedRotation.current % 360;
      let delta = targetRotation - currentPos;
      while (delta < 0) delta += 360;
      const newRotation = accumulatedRotation.current + 1800 + delta;
      accumulatedRotation.current = newRotation;
      setDisplayRotation(newRotation);

      const timeout = setTimeout(() => {
        onSpinComplete();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning, targetRotation, onSpinComplete]);

  if (prizes.length === 0) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-md items-center justify-center">
        <p className="text-subo-textMute">No prizes configured</p>
      </div>
    );
  }

  const size = 400;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius - 15;
  const prizeRadius = innerRadius - 5;
  const sectorAngle = 360 / prizes.length;
  const hubRadius = 45;

  const createSectorPath = (index: number) => {
    const startAngle = (index * sectorAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * sectorAngle - 90) * (Math.PI / 180);

    const x1 = center + prizeRadius * Math.cos(startAngle);
    const y1 = center + prizeRadius * Math.sin(startAngle);
    const x2 = center + prizeRadius * Math.cos(endAngle);
    const y2 = center + prizeRadius * Math.sin(endAngle);

    const x1Inner = center + hubRadius * Math.cos(startAngle);
    const y1Inner = center + hubRadius * Math.sin(startAngle);
    const x2Inner = center + hubRadius * Math.cos(endAngle);
    const y2Inner = center + hubRadius * Math.sin(endAngle);

    const largeArc = sectorAngle > 180 ? 1 : 0;

    return `M ${x1Inner} ${y1Inner}
            L ${x1} ${y1}
            A ${prizeRadius} ${prizeRadius} 0 ${largeArc} 1 ${x2} ${y2}
            L ${x2Inner} ${y2Inner}
            A ${hubRadius} ${hubRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner} Z`;
  };

  const getEmojiPosition = (index: number) => {
    const angle = (index * sectorAngle + sectorAngle / 2 - 90) * (Math.PI / 180);
    const emojiRadius = prizeRadius * 0.75;
    return {
      x: center + emojiRadius * Math.cos(angle),
      y: center + emojiRadius * Math.sin(angle),
      rotation: index * sectorAngle + sectorAngle / 2,
    };
  };

  const getSectorColor = (index: number, baseColor?: string) => {
    if (baseColor) return baseColor;
    return LITE_SECTOR_COLORS[index % LITE_SECTOR_COLORS.length];
  };

  return (
    <div className="relative mx-auto w-full max-w-[360px] select-none">
      {/* Outer canary glow */}
      <div
        className={`absolute inset-[-30px] rounded-full transition-all duration-500 ${
          isSpinning ? 'scale-105 opacity-100' : 'opacity-70'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(255,215,0,0.42) 0%, rgba(255,227,82,0.18) 40%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />

      {/* Pointer */}
      <div className="absolute left-1/2 top-[-12px] z-20 -translate-x-1/2">
        <div className="relative">
          <div
            className={`absolute inset-[-10px] blur-lg transition-opacity ${
              isSpinning ? 'opacity-100' : 'opacity-75'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.95) 0%, transparent 60%)',
            }}
          />
          <svg width="44" height="56" viewBox="0 0 44 56" className="relative drop-shadow-2xl">
            <defs>
              <linearGradient id="litePointerCanary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE352" />
                <stop offset="40%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#E6BE00" />
              </linearGradient>
              <filter id="litePointerGlow">
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor="#FFD700"
                  floodOpacity="0.7"
                />
              </filter>
            </defs>
            <polygon
              points="22,56 2,14 22,0 42,14"
              fill="url(#litePointerCanary)"
              filter="url(#litePointerGlow)"
            />
            <polygon points="22,50 6,16 22,4" fill="rgba(255,255,255,0.32)" />
            <circle cx="22" cy="24" r="8" fill="#FFF1A8" />
            <circle cx="22" cy="24" r="5" fill="#FFD700" />
            <circle cx="19" cy="21" r="2" fill="white" opacity="0.85" />
          </svg>
        </div>
      </div>

      {/* Main Wheel */}
      <div className="relative aspect-square">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
          <defs>
            {/* Sector gradients */}
            {prizes.map((prize, index) => {
              const color = getSectorColor(index, prize.color);
              return (
                <linearGradient
                  key={`grad-${index}`}
                  id={`liteSectorGrad-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="50%" stopColor={color} stopOpacity="0.88" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.72" />
                </linearGradient>
              );
            })}

            {/* Outer ring gradient — canary */}
            <linearGradient id="liteRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE352" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#E6BE00" />
              <stop offset="75%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFE352" />
            </linearGradient>

            {/* Hub gradient — dark with canary highlight */}
            <radialGradient id="liteHubGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#3A3220" />
              <stop offset="50%" stopColor="#23201A" />
              <stop offset="100%" stopColor="#0F0D08" />
            </radialGradient>

            <filter id="liteTextShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Background shadow */}
          <circle cx={center} cy={center + 6} r={outerRadius + 5} fill="rgba(0,0,0,0.5)" />

          {/* Outer canary ring */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="url(#liteRingGrad)"
            strokeWidth="15"
          />

          {/* Inner ring border */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="rgba(255,215,0,0.22)"
            strokeWidth="2"
          />

          {/* LED chase animation — canary */}
          <style>
            {`
              @keyframes liteLedChase {
                0%, 100% { fill: #1F1B12; stroke: #0F0D08; }
                10%, 30% { fill: #FFE352; stroke: #FFD700; }
              }
              @keyframes liteLedGlow {
                0%, 100% { opacity: 0; }
                10%, 30% { opacity: 0.55; }
              }
              .lite-led-dot { animation: liteLedChase 6s linear infinite; }
              .lite-led-glow { opacity: 0; animation: liteLedGlow 6s linear infinite; }
              .lite-led-spinning .lite-led-dot { animation-duration: 2s; }
              .lite-led-spinning .lite-led-glow { animation-duration: 2s; }
            `}
          </style>
          <g className={isSpinning ? 'lite-led-spinning' : undefined}>
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i * 18 - 90) * (Math.PI / 180);
              const ledRadius = outerRadius + 3;
              const dotX = center + ledRadius * Math.cos(angle);
              const dotY = center + ledRadius * Math.sin(angle);
              const delay = `${(i / 20) * 6}s`;
              return (
                <g key={`led-${i}`}>
                  <circle
                    className="lite-led-glow"
                    cx={dotX}
                    cy={dotY}
                    r={5}
                    fill="#FFE352"
                    style={{ filter: 'blur(2px)', animationDelay: delay }}
                  />
                  <circle
                    className="lite-led-dot"
                    cx={dotX}
                    cy={dotY}
                    r={3.5}
                    strokeWidth="1"
                    style={{ animationDelay: delay }}
                  />
                </g>
              );
            })}
          </g>

          {/* Rotating wheel group */}
          <g
            ref={wheelRef}
            style={{
              transformOrigin: `${center}px ${center}px`,
              transform: `rotate(${displayRotation}deg)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.15, 0.6, 0.1, 1)' : 'none',
            }}
          >
            {/* Sectors */}
            {prizes.map((prize, index) => (
              <path
                key={`sector-${prize.id}`}
                d={createSectorPath(index)}
                fill={`url(#liteSectorGrad-${index})`}
                stroke="rgba(255,215,0,0.20)"
                strokeWidth="2"
              />
            ))}

            {/* Sector dividers */}
            {prizes.map((_, index) => {
              const angle = (index * sectorAngle - 90) * (Math.PI / 180);
              const x1 = center + hubRadius * Math.cos(angle);
              const y1 = center + hubRadius * Math.sin(angle);
              const x2 = center + prizeRadius * Math.cos(angle);
              const y2 = center + prizeRadius * Math.sin(angle);
              return (
                <line
                  key={`divider-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,215,0,0.28)"
                  strokeWidth="2"
                />
              );
            })}

            {/* Prize emojis */}
            {prizes.map((prize, index) => {
              const pos = getEmojiPosition(index);
              return (
                <text
                  key={`emoji-${prize.id}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={prizes.length <= 6 ? '32' : '26'}
                  transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.65))' }}
                >
                  {prize.emoji}
                </text>
              );
            })}
          </g>

          {/* Center hub */}
          <circle
            cx={center}
            cy={center}
            r={hubRadius}
            fill="url(#liteHubGrad)"
            stroke="#FFD700"
            strokeWidth="3"
          />

          {/* Hub inner decoration */}
          <circle
            cx={center}
            cy={center}
            r={hubRadius - 8}
            fill="none"
            stroke="rgba(255,215,0,0.28)"
            strokeWidth="1"
          />

          {/* Hub shine */}
          <ellipse cx={center - 10} cy={center - 12} rx={15} ry={10} fill="rgba(255,215,0,0.18)" />

          {/* Center button */}
          <circle
            cx={center}
            cy={center}
            r={hubRadius - 12}
            fill="#0F0D08"
            stroke="#FFD700"
            strokeWidth="2"
          />

          {/* Center text */}
          <text
            x={center}
            y={center + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#FFE352"
            letterSpacing="0.15em"
          >
            {isSpinning ? '...' : 'SPIN'}
          </text>
        </svg>

        {/* Spinning overlay glow */}
        {isSpinning && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.28) 0%, transparent 50%)',
              animation: 'pulse 0.5s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Sparkles when spinning */}
      {isSpinning && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {SPARKLE_POSITIONS.map((pos, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute h-2 w-2 animate-ping rounded-full bg-subo-canaryHi"
              style={{
                top: pos.top,
                left: pos.left,
                animationDelay: pos.delay,
                animationDuration: '1.5s',
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default LiteFortuneWheel;
