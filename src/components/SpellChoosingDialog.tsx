import { useGameStore } from "../state";
import { useState } from "react";
import { spells } from "../data/spells.ts";
import SpellRender from "./SpellRender.tsx";

const SpellChoosingDialog = () => {
  const { choosingSpells, setChosenSpells } = useGameStore();
  const [chosenSpellIndices, setChosenSpellIndices] = useState<number[]>([]);
  const chooseSpells = () => {
    setChosenSpells(chosenSpellIndices.map((csIx) => spells[csIx]));
  };

  const handleSpellClick = (ix: number) => {
    if (chosenSpellIndices.includes(ix)) {
      setChosenSpellIndices(chosenSpellIndices.filter((csIx) => csIx !== ix));
    } else {
      setChosenSpellIndices([...chosenSpellIndices, ix]);
    }
  };

  // in the renderer we have to hide the spell list after choosing so it doesn't
  // interfere with rendering them in gameplay... a weird FIXME bug here.

  return (
    <>
      <div
        hidden={!choosingSpells}
        className="bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-fit z-20"
      >
        {`Choose 2 spells to start with`}
        {!choosingSpells
          ? []
          : spells.map((spell, ix) => (
              <div
                key={ix}
                onClick={() => handleSpellClick(ix)}
                className="cursor-pointer"
              >
                <SpellRender
                  spellData={{
                    spell,
                    complete: spell.requiredTiles.map(() => false),
                  }}
                  spellIndex={ix}
                  castable={chosenSpellIndices.includes(ix)}
                />
              </div>
            ))}
        <button
          disabled={chosenSpellIndices.length !== 2}
          onClick={chooseSpells}
          className={`font-bold text-xl p-1 rounded ${chosenSpellIndices.length !== 2 ? "border-gray-400 text-gray-400" : "border-gray-900"} border-4`}
        >
          Choose these 2 spells
        </button>
      </div>
    </>
  );
};

export default SpellChoosingDialog;
