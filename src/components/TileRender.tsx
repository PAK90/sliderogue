import { Tile, useGameStore } from "../state";
import { tileColourMap, upgradeColourMap } from "../data/constants.ts";

const TileRender = ({ tile }: { tile: Tile }) => {
  const { boards, upgrading, setSelectedTiles } = useGameStore();
  const { availableSpells, selectedTiles } = boards[0];

  // hack considering there's only one active spell for now
  // TODO: make this work for N active spells
  const activeSpell = availableSpells[0];
  const spellNeedsThisTile = activeSpell.spell.requiredTiles.find((rt) => {
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

export default TileRender;
