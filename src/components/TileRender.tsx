import { Tile, useGameStore } from "../state";

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
    1024: "bg-orange-500",
  };

  const { openShopping, gold } = useGameStore();

  const handleTileClick = () => {
    // only allow opening of the store when player has gold, to prevent just getting rid of the tiles
    if (
      typeof tile.value === "string" &&
      tile.value.indexOf("$") > -1 &&
      gold > 0
    ) {
      openShopping(tile.value, tile.id);
    }
  };

  return (
    <div
      onClick={handleTileClick}
      className={`
                  w-20 h-20 ${tileColourMap[tile.value as keyof typeof tileColourMap]} 
                  rounded flex items-center justify-center
                  animate-growIn
                  ${tile.value.toString().indexOf("$") > -1 && "cursor-pointer"}
                `}
      style={{
        transformStyle: "preserve-3d",
        position: "absolute",
        left: tile.position.x * 80 + 8 + tile.position.x * 8,
        top: tile.position.y * 80 + 8 + tile.position.y * 8,
        transition: "top 100ms linear, left 100ms linear",
      }}
    >
      <span className="text-gray-600 font-bold text-3xl">{tile.value}</span>
    </div>
  );
};

export default TileRender;
