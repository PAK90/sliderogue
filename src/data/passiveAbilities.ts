import { DamageCtx, EntityId, GameState, Player } from "../state";
import { Enemy } from "./enemies.ts";

export type PassiveAbility = {
  name: string;
  priority?: number; // higher runs first
  // Mutate ctx.amount in-place (like your effects pipeline)
  modifyIncomingDamage?: (
    state: GameState | import("immer").Draft<GameState>,
    selfId: EntityId,
    ctx: DamageCtx,
  ) => void;
  // Add more hooks later if you like (onDeath, onSlide, etc.)
};

export const ShielderPassive = (amount: number): PassiveAbility => ({
  name: "Shielder",
  priority: 100, // run before other reductions if you want
  modifyIncomingDamage(state, selfId, ctx) {
    const self = state.entities[selfId] as Enemy | undefined;
    const target = state.entities[ctx.target] as Enemy | Player | undefined;
    if (!self || !target) return;

    // Same team? (player vs enemies); tweak if you add teams later
    const sameTeam = self.kind === "enemy" && target.kind === "enemy";

    // “Behind” means higher linePos than the shielder
    if (sameTeam && target.position > self.position) {
      ctx.amount = Math.max(0, ctx.amount - amount);
    }
  },
});
