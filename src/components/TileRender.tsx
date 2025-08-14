import { tileColourMap } from "../data/constants.ts";

const TileRender = ({
  tile,
}: {
  tile: {
    name: string;
    value: number;
  };
}) => {
  const value = tile.value || 2;
  return (
    <div
      className={`
                  w-10 h-10 ${tileColourMap[tile.name as keyof typeof tileColourMap]} 
                  rounded flex items-center justify-center
                  animate-growIn
                  ${value.toString().indexOf("$") > -1 && "cursor-pointer"}
                `}
      style={{
        // opacity: spellData.complete[ix] ? "100%" : "50%",
        position: "relative",
      }}
    >
      <span className="text-gray-600 font-bold text-xl">{value}</span>
      <span
        style={{ position: "absolute", top: 4, left: 4 }}
        className="text-gray-700 font-bold text-xs"
      >
        {tile.name}
      </span>
    </div>
  );
};

export default TileRender;
