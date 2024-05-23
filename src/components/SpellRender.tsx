import { Spell } from "../spells.ts";

const SpellRender = ({
  activeSpell,
}: {
  activeSpell: { spell: Spell; complete: boolean[] };
}) => {
  const colourMap = {
    W: "bg-blue-300",
    F: "bg-red-300",
  };

  const tileRender = (
    t: { tileValue: number; tileName: string },
    ix: number,
  ) => (
    <div
      key={ix}
      className={`
                  w-20 h-20 ${colourMap[t.tileName as keyof typeof colourMap]} 
                  rounded flex items-center justify-center
                  animate-growIn
                  ${t.tileValue.toString().indexOf("$") > -1 && "cursor-pointer"}
                `}
      style={{
        transform: "scale(0.6)",
        transformStyle: "preserve-3d",
        transition: "top 100ms linear, left 100ms linear",
        opacity: activeSpell.complete[ix] ? "100%" : "50%",
      }}
    >
      <span className="text-gray-600 font-bold text-3xl">{t.tileValue}</span>
      <span
        style={{ position: "absolute", top: 4, left: 4 }}
        className="text-gray-700 font-bold text-xl"
      >
        {t.tileName}
      </span>
    </div>
  );

  return (
    <div>
      {activeSpell.spell.name}
      <div className="flex">
        {activeSpell.spell.requiredTiles.map((rt, rtIx) => {
          return tileRender(rt, rtIx);
        })}
      </div>
    </div>
  );
};

export default SpellRender;
