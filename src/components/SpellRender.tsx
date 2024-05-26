import { Spell } from "../data/spells.ts";

const SpellRender = ({
  spellData,
}: {
  spellData: { spell: Spell; complete: boolean[] };
}) => {
  const colourMap = {
    W: "bg-blue-300",
    F: "bg-red-300",
    A: "bg-amber-300",
    E: "bg-green-300",
  };

  const tileRender = (
    t: { tileValue: number; tileName: string },
    ix: number,
  ) => (
    <div
      key={ix}
      className={`
                  w-10 h-10 ${colourMap[t.tileName as keyof typeof colourMap]} 
                  rounded flex items-center justify-center
                  animate-growIn
                  ${t.tileValue.toString().indexOf("$") > -1 && "cursor-pointer"}
                `}
      style={{
        opacity: spellData.complete[ix] ? "100%" : "50%",
      }}
    >
      <span className="text-gray-600 font-bold text-xl">{t.tileValue}</span>
      <span
        style={{ position: "absolute", top: 4, left: 4 }}
        className="text-gray-700 font-bold text-xs"
      >
        {t.tileName}
      </span>
    </div>
  );

  return (
    <div>
      {spellData.spell.name}
      <div className="flex">
        {spellData.spell.requiredTiles.map((rt, rtIx) => {
          return tileRender(rt, rtIx);
        })}
      </div>
    </div>
  );
};

export default SpellRender;
