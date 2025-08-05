import { Player, useGameStore } from "../state";
import { Enemy } from "../data/enemies.ts";
import { Ability } from "../data/abilities.ts";

const CombatBoard = () => {
  const {
    player,
    enemies,
    boards,
    targeting,
    chosenTargets,
    setChosenTargets,
  } = useGameStore();
  const boardState = boards[0];
  const { numberOfSlides } = boardState;

  function isEnemy(entity: Player | Enemy): entity is Enemy {
    return "abilities" in entity; // <– proper narrowing
  }

  const addToTargets = (eIndex: number) => {
    if (targeting) setChosenTargets(eIndex);
  };

  const renderEntity = (entity: Player | Enemy, enemyIndex: number) => {
    let ability: Ability | undefined;

    if (isEnemy(entity) && entity.abilities.length) {
      ability = entity.abilities[0];
    }

    const health = `${entity.currentHealth}/${entity.maxHealth}`;

    return (
      <div
        onClick={() => addToTargets(enemyIndex)}
        className={`${targeting && "hover:bg-amber-200 cursor-pointer"} ${chosenTargets.includes(enemyIndex) && "bg-amber-500"}`}
      >
        {/* name only if it exists, otherwise “Player” */}
        {isEnemy(entity) ? entity.name : "Player"} {health}{" "}
        {ability /* only show this part if we actually have an ability */ &&
          `Activating ability "${ability.name}" in ${
            ability.slidesToActivate -
            (numberOfSlides % ability.slidesToActivate)
          } slides`}
      </div>
    );
  };

  return (
    <div>{[player, ...enemies].map((e, eIx) => renderEntity(e, eIx - 1))}</div>
  );
};

export default CombatBoard;
