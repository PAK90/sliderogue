import { Tile } from "../state";

const TileRender = ({ tile }: { tile: Tile }) => {
  const tileColourMap = {
    $: "bg-amber-200",
    $$: "bg-amber-300",
    $$$$: "bg-amber-400",
    2: "bg-blue-100",
    4: "bg-blue-200",
    8: "bg-blue-300",
    16: "bg-purple-300",
    32: "bg-purple-200",
    64: "bg-red-200",
    128: "bg-red-300",
    256: "bg-red-400",
    512: "bg-red-500",
  };

  return (
    <div
      key={tile.id}
      className={`
                  w-16 h-16 ${tileColourMap[tile.value as keyof typeof tileColourMap]} rounded flex items-center justify-center
                `}
      style={{
        position: "absolute",
        left: tile.position.x * 80 + tile.position.x * 12,
        top: tile.position.y * 80 + tile.position.y * 12,
        transition: "top 100ms linear, left 100ms linear",
      }}
    >
      <span className="text-gray-600 font-bold text-3xl">{tile.value}</span>
    </div>
  );
};

export default TileRender;
