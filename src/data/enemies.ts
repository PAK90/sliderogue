import { Ability, basicDealDamageAbility } from "./abilities.ts";

export type Enemy = {
  position: number; // the order in which the enemy appears
  maxHealth: number;
  currentHealth: number;
  abilities: Ability[];
  name: string;
};

export const GolbinEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [basicDealDamageAbility],
  name: "Golbin",
};
