import { Ability, basicDealDamageAbility } from "./abilities.ts";
import { uniqueId } from "../helpers/uniqueId.ts";

export type Enemy = {
  maxHealth: number;
  currentHealth: number;
  abilities: Ability[];
  name: string;
  id: number;
};

export const GolbinEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [basicDealDamageAbility],
  name: "Golbin",
  id: uniqueId(),
};
