import { isPlayer, Player, useGameStore } from "../state";
import { Enemy, isEnemy } from "../data/enemies.ts";
import { Ability } from "../data/abilities.ts";
import { useEffect } from "react";

const CombatBoard = () => {
  const {
    // player,
    boards,
    targeting,
    chosenTargets,
    setChosenTargets,
    // defeatEnemy,
    resetGame,
    entities,
  } = useGameStore();
  const boardState = boards[0];
  const { numberOfSlides } = boardState;
  // const enemies = waves[activeWave];
  const enemies = Object.values(entities).filter(isEnemy);
  const player = Object.values(entities).filter(isPlayer)[0];

  // function isEnemy(entity: Player | Enemy): entity is Enemy {
  //   return "abilities" in entity; // <– proper narrowing
  // }

  const addToTargets = (eIndex: number) => {
    if (targeting) setChosenTargets(eIndex);
  };

  // monitor the enemies to remove them from play when they die
  // useEffect(() => {
  //   enemies.forEach((enemy) => {
  //     if (enemy.currentHealth <= 0) {
  //       defeatEnemy(enemy);
  //     }
  //   });
  // }, [enemies, defeatEnemy]);

  useEffect(() => {
    if (player.currentHealth <= 0) {
      window.alert("whoops you ded, pls try again");
      resetGame();
    }
  }, [player, resetGame]);

  const renderEntity = (entity: Player | Enemy, enemyIndex: number) => {
    const enemy = isEnemy(entity);
    const ability: Ability | undefined =
      enemy && entity.abilities.length ? entity.abilities[0] : undefined;

    const ratio = Math.max(
      0,
      Math.min(1, entity.currentHealth / entity.maxHealth),
    );

    const baseBg = enemy ? "bg-red-100" : "bg-amber-50"; // light base
    const fillBg = enemy ? "bg-red-400" : "bg-amber-300"; // darker fill

    return (
      <div
        onClick={() => addToTargets(enemyIndex)}
        className={[
          "relative overflow-hidden rounded flex flex-col",
          baseBg,
          targeting ? "cursor-pointer hover:ring-4 hover:ring-green-300" : "",
          chosenTargets.includes(enemyIndex) ? "ring-4 ring-green-500" : "",
        ].join(" ")}
        style={{ width: 100 }}
      >
        {/* Health fill (behind content) */}
        <div
          className={`absolute inset-x-0 bottom-0 ${fillBg} transition-[height] duration-300`}
          style={{ height: `${ratio * 100}%` }}
        />

        {/* Content */}
        <div className="relative p-2">
          <p className="font-medium">
            {enemy ? entity.name : "Player"} {entity.currentHealth}/
            {entity.maxHealth}
          </p>
          <p className="text-wrap text-sm">
            {ability &&
              `Activating ability "${ability.name}" in ${
                ability.slidesToActivate -
                (numberOfSlides % ability.slidesToActivate)
              } slides`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row p-2 gap-2">
      {[player, ...enemies].map((e, eIx) => renderEntity(e, eIx - 1))}
    </div>
  );
};

export default CombatBoard;
