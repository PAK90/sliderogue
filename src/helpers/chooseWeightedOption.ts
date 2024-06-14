import { TileType, TileUpgrades } from "../state";

export type Option = {
  weight: number;
  id: string;
  type: TileType;
  value?: number;
  upgrades?: TileUpgrades[];
};

export default function chooseWeightedOption(options: Option[]): Option {
  const sum = options.reduce((acc, option) => acc + option.weight, 0);
  let random = Math.random() * sum;

  for (let i = 0; i < options.length; i++) {
    if (random < options[i].weight) {
      return options[i];
    }
    random -= options[i].weight;
  }

  // In case the input is not properly formatted and the loop doesn't return, this line ensures a fallback
  return options[options.length - 1];
}
