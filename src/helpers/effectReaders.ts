// Narrow state type so these work with Draft<GameState> or GameState
import { EffectInstance, EffectName, EntityId, GameState } from "../state";
import { effectDefs } from "../data/effects.ts";

type AnyState = GameState | import("immer").Draft<GameState>;

/** All effects on a target (sorted by priority, same as your pipelines) */
export function effectsOn(state: AnyState, target: EntityId): EffectInstance[] {
  const ids = state.effectsByTarget[target] ?? [];
  return ids
    .map((id) => state.effects[id])
    .filter((e): e is EffectInstance => !!e)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/** All effects on a target with a given name */
export function effectsOnByName(
  state: AnyState,
  target: EntityId,
  name: EffectName,
): EffectInstance[] {
  return effectsOn(state, target).filter((e) => e.name === name);
}

/** A numeric “value” for an effect instance using your registry’s getValue/format */
export function effectValue(self: EffectInstance): number | null {
  const def = effectDefs[self.name];
  if (!def?.getValue) return null;
  const v = def.getValue(self);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Sum (or max) the numeric value of all effects with this name on the target */
export function sumEffectValue(
  state: AnyState,
  target: EntityId,
  name: EffectName,
): number {
  return effectsOnByName(state, target, name).reduce(
    (acc, e) => acc + (effectValue(e) ?? 0),
    0,
  );
}
// If you prefer max instead of sum sometimes:
export function maxEffectValue(
  state: AnyState,
  target: EntityId,
  name: EffectName,
): number {
  return Math.max(
    0,
    ...effectsOnByName(state, target, name).map(
      (e) => effectValue(e) ?? -Infinity,
    ),
  );
}
