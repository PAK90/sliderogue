import { Spell } from "../data/spells.ts";
import TileRender from "./TileRender.tsx";
import { Tile } from "../state";

const SpellRender = ({
  spellData,
  // satisfied,
  spellIndex,
  castable,
}: {
  spellData: { spell: Spell; complete: (false | Tile)[] };
  // satisfied: boolean;
  spellIndex: number;
  castable?: boolean;
}) => {
  return (
    <div className="relative rounded">
      {castable && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient
              id="spellBorderGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#f97316" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 .5 .5"
                to="360 .5 .5"
                dur="4s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <rect
            x="2"
            y="2"
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            rx="12"
            ry="12"
            fill="none"
            stroke="url(#spellBorderGrad)"
            strokeWidth="4"
          />
        </svg>
      )}
      <div
        data-spell-index={spellIndex}
        className={`flex space-x-1 p-2 rounded bg-white/80 `}
      >
        <div>{`${spellData.spell.name} (${spellData.spell.description})`}</div>
        <div>{`Mana cost: ${spellData.spell.manaCost}`}</div>
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
  );
};

export default SpellRender;
