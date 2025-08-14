import { Spell } from "../data/spells.ts";
import TileRender from "./TileRender.tsx";

const SpellRender = ({
  spellData,
}: {
  spellData: { spell: Spell; complete: boolean[] };
}) => {
  return (
    <div>
      <div>
        <div className="flex space-x-1 p-2">
          <div>{`${spellData.spell.name} (${spellData.spell.description})`}</div>
          {spellData.spell.requiredTiles.map((rt, rtIx) => (
            <TileRender tile={{ name: rt.tileName, value: rt.tileValue }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpellRender;
