import { Coordinate } from "../state";

const ConnectionRender = ({
  connectionLine,
}: {
  connectionLine: Coordinate[];
}) => {
  const TILE_SIZE = 448 / 5;
  const pointString = connectionLine
    .map(
      (c) =>
        `${c.x * TILE_SIZE + TILE_SIZE / 2}, ${c.y * TILE_SIZE + TILE_SIZE / 2}`,
    )
    .join(" ");
  return (
    <polyline
      strokeWidth={20}
      stroke="#111"
      strokeOpacity={0.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="transparent"
      points={pointString}
    />
  );
};

export default ConnectionRender;
