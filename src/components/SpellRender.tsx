import { Spell } from "../data/spells.ts";
import TileRender from "./TileRender.tsx";

const SpellRender = ({
  spellData,
  satisfied,
}: {
  spellData: { spell: Spell; complete: boolean[] };
  satisfied: boolean;
}) => {
  return (
    <div>
      <div>
        <div className="flex space-x-1 p-2">
          <div>{`${spellData.spell.name} (${spellData.spell.description})`}</div>
          {spellData.spell.requiredTiles.map((rt) => (
            <TileRender
              tile={{ name: rt.tileName, value: rt.tileValue }}
              faded={!satisfied}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpellRender;
