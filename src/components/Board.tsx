import TileRender from "./TileRender.tsx";
import range from "../helpers/range.ts";
import { BoardState } from "../state";

const Board = ({ board }: { board: BoardState; boardIndex: number }) => {
  const { tiles, boardHeight, boardWidth, score } = board;

  return (
    <div className="flex-col">
      <div className="bg-amber-200 w-fit m-1 p-0.5 rounded">{`Score: ${score}`}</div>
      <div className="w-full bg-gray-400 p-1 relative">
        <div
          className={"absolute z-10 pointer-events-none"}
          style={{ left: "-0.00625rem", top: "-0.00625rem" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: `${28}rem`, width: `${28}rem` }}
            viewBox={`0 0 ${(boardWidth * 448) / boardWidth} ${(boardHeight * 448) / boardHeight}`}
          ></svg>
        </div>
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
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
