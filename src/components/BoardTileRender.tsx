import { Tile, useGameStore } from "../state";
import { tileColourMap, upgradeColourMap } from "../data/constants.ts";

const BoardTileRender = ({ tile }: { tile: Tile }) => {
  const { boards, upgrading, setSelectedTiles, player } = useGameStore();
  const { selectedTiles } = boards[0];

  function union<T>(arrays: T[][]): T[] {
    return [...new Set(arrays.flat())];
  }

  const activeSpells = player.chosenSpells;
  const combinedRequiredTilePool = union(
    activeSpells.map((as) => as.spell.requiredTiles),
  );
  const spellNeedsThisTile = combinedRequiredTilePool.find((rt) => {
    if (rt.tileValue === tile.value && rt.tileName === tile.name) {
      return true;
    }
  });

  const selected = selectedTiles.find((st) => st.id === tile.id);

  const shadowString = tile.upgrades
    .map(
      (upgrade, uIx) =>
        `inset 0 0 0 ${(uIx + 1) * 5}px ${upgradeColourMap[upgrade]}`,
    )
    .join(", ");

  return (
    <div
      onClick={() => {
        setSelectedTiles(tile, 0);
      }}
      data-tile-id={tile.id}
      className={`
                  w-20 h-20 ${tileColourMap[tile.name as keyof typeof tileColourMap]} 
                  rounded flex items-center justify-center
                  animate-growIn
                  absolute
                  ${!upgrading && "pointer-events-none"}
                  ${upgrading && "cursor-pointer"}
                  ${selected && "outline outline-gray-100 outline-4"}
                  ${spellNeedsThisTile && "border-4 border-gray-900"}
                `}
      style={{
        transformStyle: "preserve-3d",
        // position: "absolute",
        left: tile.position.x * 80 + 8 + tile.position.x * 8,
        top: tile.position.y * 80 + 8 + tile.position.y * 8,
        transition: "top 100ms linear, left 100ms linear",
        boxShadow: shadowString,
      }}
    >
      <span className="text-gray-600 font-bold text-3xl">{tile.value}</span>
      <span
        style={{ position: "absolute", top: 4, left: 4 }}
        className="text-gray-700 font-bold text-xl"
      >
        {tile.name}
      </span>
    </div>
  );
};

export default BoardTileRender;
