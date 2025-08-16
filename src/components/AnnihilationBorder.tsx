import { useId } from "react";
import { AnnihilationPair } from "../state";

type Props = {
  annihilation: AnnihilationPair;
  strokeWidth?: number;
  colors?: [string, string, string]; // gradient stops
  dash?: number; // dash length
  gap?: number; // gap length
};

const AnnihilationBorder = ({
  annihilation,
  strokeWidth = 4,
  colors = ["#f97316", "#a855f7", "#06b6d4"], // orange → purple → cyan
  dash = 16,
  gap = 12,
}: Props) => {
  const TILE_SIZE = 80;
  const { x: x1, y: y1 } = annihilation.winner.position;
  const { x: x2, y: y2 } = annihilation.loser.position;

  // Rectangle geometry
  const minX = Math.min(x1, x2) * (TILE_SIZE + 10);
  const minY = Math.min(y1, y2) * (TILE_SIZE + 10);
  const width = (Math.abs(x1 - x2) + 1) * (TILE_SIZE + 8);
  const height = (Math.abs(y1 - y2) + 1) * (TILE_SIZE + 8);
  const cx = minX + width / 2;
  const cy = minY + height / 2;

  // Unique IDs for defs
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `annihilation-grad-${uid}`;
  const glowId = `annihilation-glow-${uid}`;

  return (
    <>
      <defs>
        {/* Rotating linear gradient */}
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={minX}
          y1={minY}
          x2={minX + width}
          y2={minY + height}
        >
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="4s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>

      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        rx={5}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        // strokeDasharray={`${dash} ${gap}`}
        filter={`url(#${glowId})`}
      >
        {/* marching-ants shimmer */}
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to={dash + gap}
          dur="1.4s"
          repeatCount="indefinite"
        />
      </rect>
    </>
  );
};

export default AnnihilationBorder;
