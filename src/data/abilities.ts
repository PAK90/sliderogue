import { WritableDraft } from "immer";
import { Actions, GameState } from "../state";

export type Ability = {
  slidesToActivate: number;
  target: "PLAYER" | "ALLY"; // in this case player = player and ally = other monsters
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
  name: string;
};

export const basicDealDamageAbility: Ability = {
  slidesToActivate: 5,
  target: "PLAYER",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.player.currentHealth -= 5;
    return state;
  },
  name: "I Whack You For 5!",
};
