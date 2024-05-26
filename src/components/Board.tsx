import TileRender from "./TileRender.tsx";
import range from "../helpers/range.ts";
import { BoardState } from "../state";
import SpellRender from "./SpellRender.tsx";

const Board = ({ board }: { board: BoardState }) => {
  const { tiles, boardHeight, boardWidth } = board;

  return (
    <div className="flex-col">
      <div className="w-full bg-gray-400 p-1" style={{ position: "relative" }}>
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
      {board.availableSpells.map((spell) => (
        <SpellRender spellData={spell} />
      ))}
    </div>
  );
};

export default Board;
