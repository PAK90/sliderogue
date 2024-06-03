import { useGameStore } from "../state";
import { Upgrade, upgrades } from "../data/upgrades.ts";

function ShopDialog() {
  const { shopping, closeShopping, boards, applyUpgrade } = useGameStore();
  if (!boards.length) return;
  const { gold, usedUpgrades } = boards[0];

  const upgradeDisplay = (upgrade: Upgrade) => {
    const disabled = (upgrade?.cost || 0) > gold;
    const timesUsed = usedUpgrades.filter((uu) => uu === upgrade.name).length;
    return (
      <div className={"m-1 p-1 bg-indigo-300 rounded-lg"}>
        <div className={"font-bold"}>{upgrade.name}</div>
        <div>{upgrade.description}</div>
        <button
          disabled={disabled}
          onClick={() => applyUpgrade(upgrade)}
          className={
            "text-amber-400 bg-indigo-500 cursor-pointer rounded-lg p-1"
          }
        >{`${upgrade.cost * upgrade.costMultiplier ** timesUsed} gold`}</button>
      </div>
    );
  };

  return (
    <>
      <div
        hidden={!shopping}
        className="bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-fit z-20"
      >
        {`You have ${gold} gold to spend`}
        {upgrades.map(upgradeDisplay)}
        <button onClick={closeShopping}>Close Shop</button>
      </div>
    </>
  );
}

export default ShopDialog;
