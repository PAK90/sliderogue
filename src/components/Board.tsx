import TileRender from "./TileRender.tsx";
import range from "../helpers/range.ts";
import { BoardState } from "../state";
import SpellRender from "./SpellRender.tsx";
import AnnihilationBorder from "./AnnihilationBorder.tsx";

const Board = ({ board }: { board: BoardState }) => {
  const { tiles, boardHeight, boardWidth, imminentAnnihilations } = board;

  return (
    <div className="flex-col">
      <div className="w-full bg-gray-400 p-1 relative">
        <div
          className={"absolute z-10 pointer-events-none"}
          style={{ left: "-0.00625rem", top: "-0.00625rem" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            // className="h-full w-max"
            style={{ height: `${28}rem`, width: `${28}rem` }}
            viewBox={`0 0 ${(boardWidth * 448) / boardWidth} ${(boardHeight * 448) / boardHeight}`}
          >
            {imminentAnnihilations.map((imm, immIx) => (
              <AnnihilationBorder annihilation={imm} key={immIx} />
            ))}
          </svg>
        </div>
        {/*<div className="position-absolute">*/}
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
        {/*</div>*/}
      </div>
      {board.availableSpells.map((spell) => (
        <SpellRender spellData={spell} />
      ))}
    </div>
  );
};

export default Board;
