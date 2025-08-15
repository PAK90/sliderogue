import { Ability, basicDealDamageAbility } from "./abilities.ts";
import { uniqueId } from "../helpers/uniqueId.ts";

export type Enemy = {
  maxHealth: number;
  currentHealth: number;
  abilities: Ability[];
  name: string;
  id: number;
  loot: { type: string; quantity: number }[]; // yes I know; it's because I don't know what loot will be yet
};

export const GolbinEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [basicDealDamageAbility],
  name: "Golbin",
  id: -1,
  loot: [{ type: "GOLD", quantity: 3 }],
};

export function createEnemy(enemy: Enemy) {
  return { ...enemy, id: uniqueId() };
}
