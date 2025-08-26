import { Ability, basicDealDamageAbility } from "./abilities.ts";
import { uniqueId } from "../helpers/uniqueId.ts";
// import { Buff } from "./buffs.ts";
import { Entity, Player } from "../state";

export interface Enemy extends Entity {
  abilities: Ability[];
  loot: { type: string; quantity: number }[]; // yes I know; it's because I don't know what loot will be yet
  // buffs: Buff[];
}

export const isEnemy = (e: Player | Enemy): e is Enemy => e.kind === "enemy";

export const GolbinEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [basicDealDamageAbility],
  name: "Golbin",
  id: "-1",
  buffs: [],
  loot: [{ type: "GOLD", quantity: 3 }],
  kind: "enemy",
};

export function createEnemy(enemy: Enemy) {
  return { ...enemy, id: uniqueId() };
}
