import { useGameStore } from "../state";
import { rollRandomSpell, Spell } from "../data/spells.ts";
import SpellRender from "./SpellRender.tsx";

const GoalChooserDialog = () => {
  const { choosing, setChoosing, setActiveSpell } = useGameStore();

  const spellChoiceHandler = (chosenSpell: Spell) => {
    setChoosing(); // toggle off the dialog
    setActiveSpell(chosenSpell, 0);
  };

  const choiceOfThree: Spell[] = [];

  while (choiceOfThree.length < 3) {
    const potentialNewSpell = rollRandomSpell();
    if (!choiceOfThree.find((s) => s.name === potentialNewSpell.name)) {
      choiceOfThree.push(potentialNewSpell);
    }
  }

  return (
    <>
      <div
        hidden={!choosing}
        className="bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-1/2 z-20"
      >
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
