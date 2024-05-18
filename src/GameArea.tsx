import range from "./helpers/range.ts";
import { useGameStore } from "./state";
import React, { useEffect } from "react";

const GameArea = () => {
  const { boardWidth, boardHeight, tiles, move, score, resetGame } =
    useGameStore();

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

  const tileColourMap = {
    2: "bg-blue-100",
    4: "bg-blue-200",
    8: "bg-blue-300",
    16: "bg-purple-300",
    32: "bg-purple-200",
    64: "bg-red-200",
    128: "bg-red-300",
    256: "bg-red-400",
    512: "bg-red-500",
  };

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <>
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
          {tiles.map((tile) => {
            return (
              <div
                key={tile.id}
                className={`
                  w-16 h-16 ${tileColourMap[tile.value as keyof typeof tileColourMap]} rounded flex items-center justify-center
                `}
                style={{
                  position: "absolute",
                  left: tile.position.x * 80 + tile.position.x * 12,
                  top: tile.position.y * 80 + tile.position.y * 12,
                  transition: "top 100ms linear, left 100ms linear",
                }}
              >
                <span className="text-gray-600 font-bold text-3xl">
                  {tile.value}
                </span>
              </div>
            );
          })}
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
    </>
  );
};

export default GameArea;
