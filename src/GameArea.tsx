import range from "./helpers/range.ts";
import { useGameStore } from "./state";
import React from "react";

const GameArea = () => {
  const { boardWidth, boardHeight, tiles, move } = useGameStore();

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

  return (
    <>
      Score: 2048!
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full flex justify-center"
      >
        <div className="w-fit flex" style={{ position: "relative" }}>
          {tiles.map((tile) => {
            return (
              <div
                key={tile.id}
                className="w-16 h-16 bg-amber-200 rounded"
                style={{
                  position: "absolute",
                  left: tile.position.x * 80 + tile.position.x * 12,
                  top: tile.position.y * 80 + tile.position.y * 12,
                  transition: "top 100ms linear, left 100ms linear",
                }}
              >
                {tile.value}
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
