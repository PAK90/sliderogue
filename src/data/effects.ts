import {
  DamageCtx,
  DeathEvent,
  EffectDef,
  EffectId,
  EffectInstance,
  EffectName,
  Entity,
  EntityId,
  GameState,
  Player,
} from "../state";
import { uniqueId } from "../helpers/uniqueId.ts";
import { Enemy, isEnemy } from "./enemies.ts";
import shuffleArray from "../helpers/shuffleArray.ts";

function getEffectsOn(state: GameState, targetId: EntityId): EffectInstance[] {
  const ids = state.effectsByTarget[targetId] ?? [];
  return ids
    .map((id) => state.effects[id])
    .filter((e): e is EffectInstance => !!e)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)); // higher priority first
}

function removeAllEffectsOfTarget(state: GameState, targetId: EntityId) {
  const ids = state.effectsByTarget[targetId] ?? [];
  for (const id of [...ids]) removeEffectInternal(state, id);
}

function tryResolveDeath(state: GameState, evt: DeathEvent): boolean {
  const ent = state.entities[evt.entityId];
  if (!ent || ent.currentHealth > 0) return false;

  const boardState = state.boards[0];
  const { player } = state;

  // 1) Give target's effects a chance to prevent death
  let prevented = false;
  for (const eff of getEffectsOn(state, evt.entityId)) {
    const res = effectDefs[eff.name]?.onBeforeDeath?.(state, eff, evt);
    if (res === true) {
      prevented = true;
      break;
    }
  }
  // Global effects may also prevent/redirect death if you want:
  // if (!prevented) {
  //   for (const eff of getGlobalEffects(state)) {
  //     const res = effectDefs[eff.name]?.onBeforeDeath?.(state, eff, evt);
  //     if (res === true) { prevented = true; break; }
  //   }
  // }
  if (prevented) return false;

  // 2) Fire onDeath hooks (target-local, then global)
  for (const eff of getEffectsOn(state, evt.entityId)) {
    effectDefs[eff.name]?.onDeath?.(state, eff, evt);
  }
  // for (const eff of getGlobalEffects(state)) {
  //   effectDefs[eff.name]?.onDeath?.(state, eff, evt);
  // }

  // 3) Cleanup + removal
  removeAllEffectsOfTarget(state, evt.entityId);

  // Example: drop loot if it's an enemy
  const dead = ent as Enemy | Player;
  if ((dead as Player | Enemy).kind === "enemy") {
    // const enemy = dead as Enemy;
    // TODO: push loot to inventory/state here
    // state.loot.push(...enemy.loot)
  } else {
    // window.alert("whoops you ded");
    return true;
  }

  delete state.entities[evt.entityId];

  // Example: wave progression check
  if (
    Object.values(state.entities).every(
      (e) => (e as Player | Enemy).kind !== "enemy",
    )
  ) {
    // onWaveCleared(state);
    window.alert("yay you defeated all the enemies!");
    state.activeWave++;

    if (state.activeWave > state.waves.length - 1) {
      window.alert("w00t you beat the game!");
      return true;
    } else {
      state.shopping = true;
      state.defeatedEnemies = [];
    }

    // start new round
    boardState.usableDeck = shuffleArray(player.baseTileBag);
    // boardState.temporaryDeck = [];

    // clear board, start new round!
    boardState.tiles = [];
    boardState.mana = 0;
    boardState.numberOfSlides = 0;
    state.effects = {};
    state.effectsByTarget = {};
    // for each player spell, set its completions to false.
    state.player.chosenSpells.forEach((spell) => {
      spell.complete = spell.spell.requiredTiles.map(() => false);
    });

    state.entities = {
      [state.player.id]: state.player,
      ...state.waves[state.activeWave].reduce(
        (acc, en) => {
          acc[en.id] = {
            id: en.id,
            kind: "enemy",
            name: en.name,
            maxHealth: en.maxHealth,
            currentHealth: en.currentHealth,
            abilities: en.abilities,
            passiveAbilities: en.passiveAbilities,
            loot: en.loot,
            position: en.position,
          } as Enemy;
          return acc;
        },
        {} as Record<EntityId, Enemy>,
      ),
    };
  }

  return true;
}

export function addEffectInternal(
  state: GameState,
  target: EntityId,
  name: EffectName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  opts?: {
    durationSlides?: number;
    priority?: number;
    stacking?: "add" | "refresh" | "replace";
  },
) {
  // Stacking policy: operate on an existing effect of same name+target if found
  const existingId = (state.effectsByTarget[target] ?? []).find(
    (id) => state.effects[id]?.name === name,
  );
  if (existingId) {
    const eff = state.effects[existingId]!;
    switch (opts?.stacking ?? "add") {
      case "replace":
        eff.data = { ...data };
        break;
      case "refresh":
        Object.assign(eff.data, data);
        break;
      case "add":
      default:
        for (const k of Object.keys(data)) {
          const v = data[k];
          if (typeof v === "number" && typeof eff.data[k] === "number") {
            eff.data[k] += v;
          } else {
            eff.data[k] = v;
          }
        }
        break;
    }
    if (opts?.durationSlides != null) {
      eff.expiresAtSlide = state.boards[0].numberOfSlides + opts.durationSlides;
    }
    if (opts?.priority != null) eff.priority = opts.priority;
    return eff.id;
  }

  const id = uniqueId();
  console.log("[addEffectInternal] before:", {
    len: Object.keys(state.effects).length,
  });

  const eff: EffectInstance = {
    id,
    name,
    target,
    data: { ...data },
    expiresAtSlide:
      opts?.durationSlides != null
        ? state.boards[0].numberOfSlides + opts.durationSlides
        : undefined,
    priority: opts?.priority ?? 0,
  };
  state.effects[id] = eff;
  (state.effectsByTarget[target] ??= []).push(id);
  console.log("[addEffectInternal] after:", {
    id,
    effects: state.effects,
    byTarget: state.effectsByTarget[target],
  });

  return id;
}

export function removeEffectInternal(state: GameState, id: EffectId) {
  const eff = state.effects[id];
  if (!eff) return;
  const list = state.effectsByTarget[eff.target];
  if (list) {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    if (list.length === 0) delete state.effectsByTarget[eff.target];
  }
  delete state.effects[id];
}

function runPassivesModifyIncoming(
  state: GameState | import("immer").Draft<GameState>,
  targetId: EntityId,
  ctx: DamageCtx,
) {
  console.log(targetId, ctx);
  // If you want only allies’ passives, iterate all entities and let passives decide.
  const all = Object.values(state.entities);
  // Optionally order by priority
  const sources = all
    .filter(
      (e: Entity) =>
        e?.kind === "enemy" && (e as Enemy).passiveAbilities?.length,
    )
    .flatMap((e) => (e as Enemy).passiveAbilities!.map((p) => ({ e, p })))
    .sort((a, b) => (b.p.priority ?? 0) - (a.p.priority ?? 0));

  for (const { e, p } of sources) {
    p.modifyIncomingDamage?.(state, e.id, ctx);
    if (ctx.amount <= 0) break;
  }
}

// Core damage application (internal). Call through actions for UI logging etc.
export function dealDamageInternal(
  state: GameState,
  targetId: EntityId,
  base: number,
  tags?: string[],
) {
  const ctx: DamageCtx = { target: targetId, amount: base, tags };

  // 1) PASSIVES first (global, always-on)
  runPassivesModifyIncoming(state, targetId, ctx);

  // 2) TARGET effects
  for (const eff of getEffectsOn(state, targetId)) {
    effectDefs[eff.name]?.modifyIncomingDamage?.(state, eff, ctx);
    if (ctx.amount <= 0) break;
  }

  const ent = state.entities[targetId];
  if (!ent) return;
  // TODO: re-enable this if we want no healing/only positive damage here
  // const final = Math.max(0, Math.floor(ctx.amount));
  ent.currentHealth = Math.max(0, ent.currentHealth - ctx.amount);

  if (ctx.amount > 0) {
    // const evt = { target: targetId, amount: final, tags };
    // for (const eff of getEffectsOn(state, targetId)) {
    //   effectDefs[eff.name]?.afterDamageApplied?.(state, eff, evt);
    // }
    // for (const eff of getGlobalEffects(state)) {
    //   effectDefs[eff.name]?.afterDamageApplied?.(state, eff, evt);
    // }
  }

  // NEW: resolve death (cause "damage")
  if (ent.currentHealth <= 0) {
    tryResolveDeath(state, {
      entityId: targetId,
      cause: "damage",
      amount: ctx.amount,
      tags,
    });
  }
}

// Slide progression: tick hooks then expire time-based effects
export function commitSlideInternal(state: GameState) {
  // state.slide += 1;
  const boardState = state.boards[0];
  boardState.numberOfSlides++;

  // Snapshot IDs to be safe if effects are removed during iteration
  const ids = Object.keys(state.effects);

  // have enemies do their abilities
  const enemies = Object.values(state.entities).filter(isEnemy);
  for (const enemy of enemies) {
    const cooldowns = ensureEnemyCD(state, enemy);

    // frozen!
    if (abilityTickSuppressed(state, enemy.id)) continue;

    enemy.abilities.forEach((ability, abIx) => {
      cooldowns[abIx] -= 1;

      if (cooldowns[abIx] <= 0) {
        // if (boardState.numberOfSlides % ability.slidesToActivate === 0) {
        ability.stateUpdater(state, { casterId: enemy.id, abilityIndex: abIx });
        console.log("activated enemy ability", ability);
        // Reset the cooldown (simple periodic)
        cooldowns[abIx] = ability.slidesToActivate;
      }
    });
  }

  // Tick onSlideEnd
  for (const id of ids) {
    const eff = state.effects[id];
    if (eff) {
      effectDefs[eff.name]?.onSlideEnd?.(state, eff);
    }
  }

  // Expire by time
  for (const id of Object.keys(state.effects)) {
    const eff = state.effects[id];
    if (
      eff &&
      eff.expiresAtSlide != null &&
      boardState.numberOfSlides >= eff.expiresAtSlide
    ) {
      effectDefs[eff.name]?.onExpire?.(state, eff);
      removeEffectInternal(state, id);
    }
  }
}

export const effectDefs: Record<EffectName, EffectDef> = {
  Block: {
    // Reduces incoming damage unless tagged to bypass (e.g., poison)
    modifyIncomingDamage(state, self, ctx) {
      if (ctx.tags?.includes("poison")) return; // Poison/HP-loss bypasses Block

      const amt: number = Math.max(0, Math.floor(self.data.amount ?? 0));
      if (amt <= 0 || ctx.amount <= 0) return;

      const absorb = Math.min(amt, ctx.amount);
      ctx.amount -= absorb;
      self.data.amount = amt - absorb;

      // If fully depleted, remove immediately (ABSORB-style)
      if ((self.data.amount ?? 0) <= 0) {
        removeEffectInternal(state, self.id);
      }
    },
    label: "Block",
    short: "BLK",
    getValue: (self) => Math.max(0, self.data?.amount ?? 0),
    format: (self) => `Block ${Math.max(0, self.data?.amount ?? 0)}`,
  },

  Poison: {
    // Ticks at the end of each slide (StS-like timing)
    onSlideEnd(state, self) {
      let stacks: number = Math.max(0, Math.floor(self.data.stacks ?? 0));
      if (stacks <= 0) {
        removeEffectInternal(state, self.id);
        return;
      }

      // Deal stacks damage, bypassing Block
      dealDamageInternal(state, self.target, stacks, ["poison", "hp_loss"]);

      // Decay by 1
      stacks -= 1;
      self.data.stacks = stacks;
      if (stacks <= 0) {
        removeEffectInternal(state, self.id);
      }
    },
    label: "Poison",
    short: "PSN",
    getValue: (self) => Math.max(0, self.data?.stacks ?? 0),
    format: (self) => `Poison ${Math.max(0, self.data?.stacks ?? 0)}`,
  },

  Burn: {
    // Deals a fixed amount of damage at the end of each slide, then expires.
    onSlideEnd(state, self) {
      const amount: number = Math.max(0, Math.floor(self.data.amount ?? 0));
      if (amount <= 0) {
        removeEffectInternal(state, self.id);
        return;
      }

      // Deal amount damage
      dealDamageInternal(state, self.target, amount);

      if (
        state.boards[0].numberOfSlides >= (self?.expiresAtSlide ?? Infinity)
      ) {
        removeEffectInternal(state, self.id);
      }
    },
    label: "Burn",
    short: "BRN",
    getValue: (self) => Math.max(0, self.data?.amount ?? 0),
    format: (self) => `Burn ${Math.max(0, self.data?.amount ?? 0)}`,
  },

  Freeze: {
    label: "Freeze",
    short: "FRZ",
    // Don’t let this enemy’s abilities tick this slide
    suppressAbilityTick: () => true,

    // choose one timing:
    // A) Freeze expires by your normal durationSlides/ExpiresAtSlide → no extra onSlideEnd needed
    // B) Or, if you want stacks that decay each slide:
    // onSlideEnd(state, self) {
    //   self.data.stacks = Math.max(0, (self.data.stacks ?? 0) - 1);
    //   if (self.data.stacks <= 0) removeEffectInternal(state, self.id);
    // },
  },
};

function ensureEnemyCD(state: GameState, enemy: Enemy): number[] {
  let cds = state.enemyAbilityCD[enemy.id];
  if (!cds || cds.length !== enemy.abilities.length) {
    cds = enemy.abilities.map((a) => a.slidesToActivate);
    state.enemyAbilityCD[enemy.id] = cds;
  }
  return cds;
}

function abilityTickSuppressed(state: GameState, enemyId: EntityId): boolean {
  for (const eff of getEffectsOn(state, enemyId)) {
    const def = effectDefs[eff.name];
    if (!def) continue;
    if (typeof def.suppressAbilityTick === "function") {
      if (def.suppressAbilityTick(state, eff, enemyId)) return true;
    } else if (def.suppressAbilityTick) {
      return true;
    }
  }
  return false;
}

export function formatEffect(self: EffectInstance, state?: GameState): string {
  const def = effectDefs[self.name];
  if (!def) return self.name;
  if (def.format) return def.format(self, state);
  const label = def.label ?? self.name;
  const v = def.getValue?.(self);
  return v != null ? `${label} ${v}` : label;
}
