import range from "../helpers/range.ts";
import { useGameStore } from "../state";
import React, { useEffect } from "react";
import TileRender from "./TileRender.tsx";
import { useSwipeable } from "react-swipeable";

const GameArea = () => {
  const { boardWidth, boardHeight, tiles, move, score, resetGame } =
    useGameStore();

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

  return (
    <div className="h-full" {...handlers}>
      {`Score: ${score}`}
      <button
        className="m-1 p-0.5 rounded bg-amber-200 duration-100 hover:bg-amber-300 "
        onClick={resetGame}
      >
        New Game
      </button>
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full flex justify-center"
      >
        <div className="w-fit flex " style={{ position: "relative" }}>
          {tiles.map((tile, index) => (
            <TileRender tile={tile} key={index} />
          ))}
          {range(boardWidth).map((_, rIx) => {
            return (
              <div key={`${rIx}`}>
                {range(boardHeight).map((_, cIx) => {
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
