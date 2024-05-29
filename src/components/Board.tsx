import TileRender from "./TileRender.tsx";
import range from "../helpers/range.ts";
import { BoardState, Coordinate, useGameStore } from "../state";
import SpellRender from "./SpellRender.tsx";
import AnnihilationBorder from "./AnnihilationBorder.tsx";
import { useCallback, useState } from "react";
import ConnectionRender from "./ConnectionRender.tsx";

const Board = ({
  board,
  boardIndex,
}: {
  board: BoardState;
  boardIndex: number;
}) => {
  const {
    tiles,
    boardHeight,
    boardWidth,
    imminentAnnihilations,
    draggedCells,
    mana,
  } = board;
  const { setDraggedPath, useDraggedPath } = useGameStore();

  const [drawing, setDrawing] = useState(false);
  console.log(draggedCells);

  const handleMouseDown = useCallback(
    (cell: Coordinate) => {
      setDrawing(true);
      setDraggedPath([cell], boardIndex);
    },
    [boardIndex, setDraggedPath],
  );
  const handleMouseEnter = useCallback(
    (cell: Coordinate) => {
      if (!drawing) return;

      // setPath((prevPath) => {
      const existingIndex = draggedCells.findIndex(
        (c) => c.x === cell.x && c.y === cell.y,
      );

      if (existingIndex !== -1) {
        setDraggedPath(draggedCells.slice(0, existingIndex + 1), boardIndex);
        return;
      }

      setDraggedPath([...draggedCells, cell], boardIndex);
      // });
    },
    [drawing, draggedCells, setDraggedPath, boardIndex],
  );
  const handleMouseUp = useCallback(() => {
    setDrawing(false);
    if (draggedCells.length > 1 && mana >= draggedCells.length * 10) {
      useDraggedPath(boardIndex);
    } else {
      setDraggedPath([], boardIndex);
    }
  }, [boardIndex, draggedCells.length, mana, setDraggedPath, useDraggedPath]);

  return (
    <div className="flex-col">
      <div className="bg-indigo-200 w-fit m-1 p-0.5 rounded">{`Mana: ${mana}`}</div>
      <div
        className={`${draggedCells.length * 10 > mana ? "bg-red-200" : "bg-indigo-200"} w-fit m-1 p-0.5 rounded`}
      >{`Mana used: ${draggedCells.length * 10}`}</div>
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
            <ConnectionRender connectionLine={draggedCells} />
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
                    onMouseDown={() => handleMouseDown({ x: cIx, y: rIx })}
                    onMouseEnter={() => handleMouseEnter({ x: cIx, y: rIx })}
                    onMouseUp={handleMouseUp}
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
