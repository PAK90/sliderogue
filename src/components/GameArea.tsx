import range from "../helpers/range.ts";
import { useGameStore } from "../state";
import React, { useEffect } from "react";
import TileRender from "./TileRender.tsx";
import { useSwipeable } from "react-swipeable";
import ShopDialog from "./ShopDialog.tsx";
import SpellRender from "./SpellRender.tsx";

const GameArea = () => {
  const {
    boardWidth,
    boardHeight,
    // tilesToSpawn,
    // setTilesToSpawn,
    tiles,
    move,
    score,
    // gold,
    resetGame,
    activeSpells,
  } = useGameStore();

  const handlers = useSwipeable({
    onSwiped: (eventData) => console.log("User Swiped!", eventData),
    onSwipedDown: () => move("down"),
    onSwipedUp: () => move("up"),
    onSwipedLeft: () => move("left"),
    onSwipedRight: () => move("right"),
    preventScrollOnSwipe: true,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <ShopDialog />
      <div className="flex">
        <div className="bg-indigo-200 w-fit m-1 p-0.5 rounded">{`Score: ${score}`}</div>
        {/*<div className="bg-amber-200 w-fit m-1 p-0.5 rounded">{`Gold: ${gold}`}</div>*/}
        <button
          className="m-1 p-0.5 rounded bg-green-200 duration-100 hover:bg-green-300 "
          onClick={resetGame}
        >
          New Game
        </button>
      </div>
      <div>
        {activeSpells.map((as, asIx) => (
          <SpellRender key={asIx} activeSpell={as} />
        ))}
      </div>
      <div className="w-full flex justify-center">
        <div
          className="w-full bg-gray-400 p-1"
          style={{ position: "relative" }}
        >
          {tiles.map((tile) => (
            <TileRender tile={tile} key={tile.id} />
          ))}
          {range(boardHeight).map((_, rIx) => {
            return (
              <div key={`${rIx}`} className="flex">
                {range(boardWidth).map((_, cIx) => {
                  return (
                    <div
                      key={`${rIx}${cIx}`}
                      className="w-20 h-20 rounded bg-gray-200 m-1"
                    ></div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameArea;
