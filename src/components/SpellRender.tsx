import { Spell } from "../data/spells.ts";
import TileRender from "./TileRender.tsx";
import { Tile } from "../state";

const SpellRender = ({
  spellData,
  // satisfied,
}: {
  spellData: { spell: Spell; complete: (false | Tile)[] };
  // satisfied: boolean;
}) => {
  return (
    <div>
      <div>
        <div className="flex space-x-1 p-2">
          <div>{`${spellData.spell.name} (${spellData.spell.description})`}</div>
          {spellData.spell.requiredTiles.map((rt, rtIx) => {
            const entry = spellData.complete[rtIx]; // entry: false | Tile | undefined
            const value =
              (entry === false ? undefined : entry?.value) ?? rt.tileValue;

            return (
              <TileRender
                tile={{
                  name: rt.tileName,
                  value,
                }}
                // faded={!satisfied}
                faded={!spellData.complete[rtIx]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpellRender;
