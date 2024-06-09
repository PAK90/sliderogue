import { useGameStore } from "../state";
import React, { useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import Board from "./Board.tsx";
import GoalChooserDialog from "./GoalChooserDialog.tsx";
import ShopDialog from "./ShopDialog.tsx";

const GameArea = () => {
  const { move, resetGame, boards } = useGameStore();

  const handlers = useSwipeable({
    onSwiped: (eventData) => console.log("User Swiped!", eventData),
    onSwipedDown: () => move("down"),
    onSwipedUp: () => move("up"),
    onSwipedLeft: () => move("left"),
    onSwipedRight: () => move("right"),
    preventScrollOnSwipe: true,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // make a random move on the enemy board
    // const randomDirection: Direction = ["up", "down", "left", "right"][
    //   Math.floor(Math.random() * 4)
    // ] as Direction;
    // move(randomDirection, 1);
    switch (e.key) {
      case "ArrowUp":
        move("up");
        break;
      case "ArrowDown":
        move("down");
        break;
      case "ArrowLeft":
        move("left");
        break;
      case "ArrowRight":
        move("right");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // NB for the arrangement of the nested range div renderings;
  // apparently margins collapse in the vertical but not horizontal,
  // so here we render it row by row instead of column by column as in roguesweeper.
  return (
    <div
      className="h-full"
      {...handlers}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/*{tilesToSpawn*/}
      {/*  .filter((t) => t.type === "WEAPON")*/}
      {/*  .map((option) => {*/}
      {/*    return <div>{option.id}</div>;*/}
      {/*  })}*/}
      {/*<ShopDialog />*/}
      <GoalChooserDialog />
      <ShopDialog />
      <div className="flex">
        {/*<div className="bg-amber-200 w-fit m-1 p-0.5 rounded">{`Gold: ${gold}`}</div>*/}
        <button
          className="m-1 p-0.5 rounded bg-green-200 duration-100 hover:bg-green-300 "
          onClick={resetGame}
        >
          New Game
        </button>
      </div>
      <div>
        {/*{`Fire > Air > Earth > Water > Fire`}*/}
        {/*{activeSpells.map((as, asIx) => (*/}
        {/*  <SpellRender key={asIx} activeSpell={as} />*/}
        {/*))}*/}
      </div>
      <div className="w-full flex justify-center">
        {boards.map((board, boardIx) => (
          <Board board={board} key={boardIx} boardIndex={boardIx} />
        ))}
      </div>
    </div>
  );
};

export default GameArea;
