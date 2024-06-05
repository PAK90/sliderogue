import TileRender from "./TileRender.tsx";
import range from "../helpers/range.ts";
import { BoardState, Coordinate, useGameStore } from "../state";
import SpellRender from "./SpellRender.tsx";
import AnnihilationBorder from "./AnnihilationBorder.tsx";
import { useCallback, useEffect, useState } from "react";
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
    gold,
    score,
    lines,
    spellsCompleted,
    targetScore,
  } = board;
  const { setDraggedPath, useDraggedPath } = useGameStore();

  const [drawing, setDrawing] = useState(false);
  const [scoreData, setScoreData] = useState({ tileScore: 0, length: 0 });

  const spellsCompletedRecord =
    localStorage.getItem("spellsCompletedRecord") || "0";

  useEffect(() => {
    if (spellsCompleted > parseInt(spellsCompletedRecord)) {
      localStorage.setItem("spellsCompletedRecord", spellsCompleted.toString());
    }
  }, [spellsCompleted, spellsCompletedRecord]);

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

      const existingIndex = draggedCells.findIndex(
        (c) => c.x === cell.x && c.y === cell.y,
      );

      if (existingIndex !== -1) {
        setDraggedPath(draggedCells.slice(0, existingIndex + 1), boardIndex);
        return;
      }

      setDraggedPath([...draggedCells, cell], boardIndex);
    },
    [drawing, draggedCells, setDraggedPath, boardIndex],
  );
  const handleMouseUp = useCallback(() => {
    setDrawing(false);
    if (draggedCells.length < 2) {
      setDraggedPath([], boardIndex);
    }
  }, [boardIndex, draggedCells.length, setDraggedPath]);

  useEffect(() => {
    setScoreData(
      draggedCells.reduce(
        (scoreParts, cell) => {
          const cellTile = tiles.find(
            (t) => t.position.x === cell.x && t.position.y === cell.y,
          );
          if (cellTile) {
            return {
              tileScore: scoreParts.tileScore + cellTile.value,
              length: scoreParts.length + 1,
            };
          }
          return scoreParts;
        },
        { tileScore: 0, length: 0 },
      ),
    );
  }, [draggedCells, tiles]);

  const tileSize = 448 / 5;

  return (
    <div className="flex-col">
      <div className="bg-green-200 w-fit m-1 p-0.5 rounded">
        {`Patterns completed (/record): ${spellsCompleted}/${spellsCompletedRecord}`}
      </div>
      <div className="bg-amber-200 w-fit m-1 p-0.5 rounded">{`Gold: ${gold}`}</div>
      <div className="bg-amber-200 w-fit m-1 p-0.5 rounded">{`Score: ${score}/${targetScore}`}</div>
      <div className="bg-indigo-200 w-fit m-1 p-0.5 rounded">{`Lines left: ${lines}`}</div>
      <div className="bg-indigo-200 w-fit m-1 p-0.5 rounded">{`Mana: ${mana}`}</div>
      <div
        className={`${draggedCells.length * 10 > mana ? "bg-red-200" : "bg-indigo-200"} w-fit m-1 p-0.5 rounded`}
      >{`Mana used: ${draggedCells.length * 10}`}</div>
      <div>{`${scoreData.tileScore} x ${scoreData.length}`}</div>
      <button
        onClick={() => useDraggedPath(boardIndex)}
        className="font-bold text-xl p-1 rounded border-gray-900 border-4"
      >
        Combine Tiles
      </button>
      <div className="w-full bg-gray-400 p-1 relative">
        <div
          className={"absolute z-10 pointer-events-none"}
          style={{ left: "-0.00625rem", top: "-0.00625rem" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            // className="h-full w-max"
            style={{
              height: `${(28 / 5) * boardHeight}rem`,
              width: `${(28 / 5) * boardWidth}rem`,
            }}
            viewBox={`0 0 ${boardWidth * tileSize} ${boardHeight * tileSize}`}
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
