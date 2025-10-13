import { Draft } from "immer";
import { EntityId, GameState } from "../state";
import { dealDamageInternal } from "./effects.ts";

export type Ability = {
  slidesToActivate: number;
  target: "PLAYER" | "ALLY"; // in this case player = player and ally = other monsters
  stateUpdater: (
    state: Draft<GameState>,
    ctx: { casterId: EntityId; abilityIndex: number },
  ) => void;
  name: string;
};

export const basicDealDamageAbility: Ability = {
  slidesToActivate: 5,
  target: "PLAYER",
  stateUpdater: (state: Draft<GameState>) => {
    dealDamageInternal(state, "PLAYER", 3);
  },
  name: "I Whack You For 3!",
};
