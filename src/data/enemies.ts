import { Ability, basicDealDamageAbility } from "./abilities.ts";
import { uniqueId } from "../helpers/uniqueId.ts";
// import { Buff } from "./buffs.ts";
import { Entity, Player } from "../state";
import { PassiveAbility, ShielderPassive } from "./passiveAbilities.ts";

export interface Enemy extends Entity {
  abilities: Ability[];
  passiveAbilities: PassiveAbility[];
  loot: { type: string; quantity: number }[]; // yes I know; it's because I don't know what loot will be yet
  // buffs: Buff[];
  position: number;
}

export const isEnemy = (e: Player | Enemy): e is Enemy => e.kind === "enemy";

export const GolbinEnemy = {
  position: 0,
  maxHealth: 12,
  currentHealth: 12,
  abilities: [basicDealDamageAbility],
  passiveAbilities: [],
  name: "Golbin",
  id: "-1",
  loot: [{ type: "GOLD", quantity: 3 }],
  kind: "enemy",
};

export const ShielderEnemy = {
  position: 0,
  maxHealth: 15,
  currentHealth: 15,
  abilities: [],
  passiveAbilities: [ShielderPassive(3)],
  name: "Shielder",
  id: "-2",
  loot: [{ type: "GOLD", quantity: 5 }],
  kind: "enemy",
};

export function createEnemy(
  enemy: Enemy,
  position: number,
  suffix?: string,
  // powerMultiplier = 1,
  healthMultiplier = 1,
) {
  return {
    ...enemy,
    id: uniqueId(),
    position,
    name: enemy.name + suffix,
    maxHealth: Math.floor(enemy.maxHealth * healthMultiplier),
    currentHealth: Math.floor(enemy.currentHealth * healthMultiplier),
  };
}
