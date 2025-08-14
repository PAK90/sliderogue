import { Ability, basicDealDamageAbility } from "./abilities.ts";
import { uniqueId } from "../helpers/uniqueId.ts";

export type Enemy = {
  maxHealth: number;
  currentHealth: number;
  abilities: Ability[];
  name: string;
  id: number;
  loot: any[]; // yes I know
};

export const GolbinEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [basicDealDamageAbility],
  name: "Golbin",
  id: -1,
  loot: [
    { type: "GOLD", quantity: 3 },
    { type: "TILE", quantity: 1 },
  ],
};

export function createEnemy(enemy: Enemy) {
  return { ...enemy, id: uniqueId() };
}
