import { useGameStore } from "../state";
import { rollRandomSpell, Spell, spells } from "../data/spells.ts";
import SpellRender from "./SpellRender.tsx";
import { useEffect, useState } from "react";

const GoalChooserDialog = () => {
  const { choosing, setChoosing, setActiveSpell, boards, openShopping } =
    useGameStore();
  // TODO: make this not fixed to 0.
  const activeSpell = boards[0]?.availableSpells[boards[0]?.activeSpell];

  const [isTransparent, setIsTransparent] = useState(false);
  const [choiceOfThree, setChoiceOfThree] = useState<Spell[]>([]);

  const spellChoiceHandler = (chosenSpell: Spell) => {
    setChoosing(); // toggle off the dialog
    setActiveSpell(chosenSpell, 0);
    openShopping();
  };

  useEffect(() => {
    const choices: Spell[] = [];
    while (choices.length < Math.min(3, spells.length)) {
      const potentialNewSpell = rollRandomSpell();
      if (
        !choices.find((s) => s.name === potentialNewSpell.name)
        //     potentialNewSpell.name !== activeSpell?.spell.name
      ) {
        choices.push(potentialNewSpell);
      }
    }
    setChoiceOfThree(choices);
  }, [activeSpell?.spell.name, choosing]);

  return (
    <>
      <div
        hidden={!choosing}
        className={`
          ${isTransparent ? "opacity-20" : "opacity-100"}
          bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-fit z-20
        `}
      >
        <button onClick={() => setIsTransparent(!isTransparent)}>
          Click here to see/unsee grid
        </button>
        {choiceOfThree.map((spell) => (
          <div
            key={spell.name}
            className="border-gray-900 border-2 cursor-pointer bg-gray-300 rounded"
            onClick={() => spellChoiceHandler(spell)}
          >
            <SpellRender
              spellData={{
                spell,
                complete: spell.requiredTiles.map(() => true),
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default GoalChooserDialog;
