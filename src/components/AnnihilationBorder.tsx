import { AnnihilationPair } from "../state";

const AnnihilationBorder = ({
  annihilation,
}: {
  annihilation: AnnihilationPair;
}) => {
  const TILE_SIZE = 80;
  const { x: x1, y: y1 } = annihilation.winner.position;
  const { x: x2, y: y2 } = annihilation.loser.position;

  // Calculate the top-left corner of the rectangle
  const minX = Math.min(x1, x2) * (TILE_SIZE + 10);
  const minY = Math.min(y1, y2) * (TILE_SIZE + 10);

  // Calculate the width and height of the rectangle
  const width = (Math.abs(x1 - x2) + 1) * (TILE_SIZE + 4);
  const height = (Math.abs(y1 - y2) + 1) * (TILE_SIZE + 4);
  return (
    <rect
      strokeWidth={4}
      stroke="black"
      fill="transparent"
      x={minX}
      rx={5}
      y={minY}
      width={width}
      height={height}
    />
  );
};

export default AnnihilationBorder;
