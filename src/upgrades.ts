import { WritableDraft } from "immer";
import { Actions, GameState } from "./state";

export type Upgrade = {
  name: string;
  description: string;
  stateUpdater: (
    state: WritableDraft<GameState & Actions>,
  ) => WritableDraft<GameState & Actions>;
  cost: number;
  tier: number;
  weight: number;
};

const widthUpgrade: Upgrade = {
  name: "Enwiden",
  description: "Expands the grid 1 column to the right",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boardWidth++;
    return state;
  },
  cost: 200,
  tier: 1,
  weight: 100,
};

const heightUpgrade: Upgrade = {
  name: "Enheighten",
  description: "Expands the grid 1 row down",
  stateUpdater: (state: WritableDraft<GameState & Actions>) => {
    state.boardHeight++;
    return state;
  },
  cost: 200,
  tier: 1,
  weight: 100,
};

export const upgrades = [widthUpgrade, heightUpgrade];
