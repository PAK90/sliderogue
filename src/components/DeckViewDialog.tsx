import { useGameStore } from "../state";
import { Option } from "../helpers/chooseWeightedOption.ts";
import { upgradeColourMap } from "../data/constants.ts";

const DeckViewDialog = () => {
  const {
    deckLooking,
    toggleDeckView,
    boards,
    player,
    upgrading,
    applyUpgrade,
    endUpgrading,
    setSelectedDeckTiles,
  } = useGameStore();
  // TODO: make this not fixed to 0.
  // FIXME: maybe change this to the player's base tile bag/deck? for now it's ok since we copy that to this
  // const deck = boards[0]?.usableDeck;
  const deck = player.baseTileBag;
  const selectedDeckTiles = boards[0]?.selectedDeckTiles;
  // const upgradedDeck = boards[0]?.upgradedDeck;
  if (!deck) return;

  const colourMap = {
    W: "bg-blue-300",
    F: "bg-red-300",
    A: "bg-amber-300",
    E: "bg-green-300",
  };

  const tileRender = (t: Option, ix: number) => {
    const value = t.value || 2;
    const shadowString = (
      t.upgrades?.map(
        (upgrade, uIx) =>
          `inset 0 0 0 ${(uIx + 1) * 5}px ${upgradeColourMap[upgrade]}`,
      ) || []
    ).join(", ");

    const selected = selectedDeckTiles.includes(ix);

    return (
      <div
        onClick={() => {
          setSelectedDeckTiles(ix, 0);
        }}
        key={ix}
        className={`
                  w-10 h-10 ${colourMap[t.name as keyof typeof colourMap]}
                  rounded flex items-center justify-center
                  animate-growIn
                  ${upgrading && "cursor-pointer"}
                  ${selected && "outline outline-gray-100 outline-4"}
                  ${value.toString().indexOf("$") > -1 && "cursor-pointer"}
                `}
        style={{
          position: "relative",
          boxShadow: shadowString,
        }}
      >
        <span className="text-gray-600 font-bold text-xl">{value}</span>
        <span
          style={{ position: "absolute", top: 4, left: 4 }}
          className="text-gray-700 font-bold text-xs"
        >
          {t.name}
        </span>
      </div>
    );
  };

  // const deckToUse = upgrading ? upgradedDeck : deck;

  return (
    <>
      <div
        hidden={!deckLooking}
        className={`
          bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-fit z-20
        `}
      >
        {upgrading && (
          <>
            <button
              disabled={
                upgrading.minTiles > selectedDeckTiles.length ||
                selectedDeckTiles.length > upgrading.maxTiles
              }
              onClick={() => {
                applyUpgrade(upgrading);
                endUpgrading();
              }}
              className="font-bold text-xl p-1 rounded border-gray-900 border-4"
            >
              Upgrade Tiles
            </button>
            <div>{`Select ${upgrading.minTiles} to ${upgrading.maxTiles} tiles, then click Upgrade Tiles`}</div>
          </>
        )}
        <div className="flex flex-wrap">
          {deck.map((rt, rtIx) => {
            return tileRender(rt, rtIx);
          })}
        </div>
        <button onClick={toggleDeckView}>Close Deck View</button>
      </div>
    </>
  );
};

export default DeckViewDialog;
