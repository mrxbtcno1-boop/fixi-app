export interface FixiLevel {
  level: number;
  name: string;
  minPercent: number;
  maxPercent: number;
  accessory: string;
  accessoryLabel: string;
  evolutionImage: any;
}

const FOX_STARTER  = require('../../../assets/images/fox-starter.png');
const FOX_FIGHTER  = require('../../../assets/images/fox-fighter.png');
const FOX_WARRIOR  = require('../../../assets/images/fox-warrior.png');
const FOX_CHAMPION = require('../../../assets/images/fox-champion.png');

export const FIXI_LEVELS: FixiLevel[] = [
  {
    level: 1,
    name: 'Fixi Starter',
    minPercent: 0,
    maxPercent: 10,
    accessory: 'scarf',
    accessoryLabel: 'Basis-Fixi mit Schal',
    evolutionImage: FOX_STARTER,
  },
  {
    level: 2,
    name: 'Fixi Fighter',
    minPercent: 10,
    maxPercent: 25,
    accessory: 'headband',
    accessoryLabel: 'Stirnband (mint-grün)',
    evolutionImage: FOX_FIGHTER,
  },
  {
    level: 3,
    name: 'Fixi Warrior',
    minPercent: 25,
    maxPercent: 50,
    accessory: 'cape',
    accessoryLabel: 'Umhang (lila)',
    evolutionImage: FOX_WARRIOR,
  },
  {
    level: 4,
    name: 'Fixi Champion',
    minPercent: 50,
    maxPercent: 75,
    accessory: 'shield',
    accessoryLabel: 'Schild mit Blitz-Symbol',
    evolutionImage: FOX_CHAMPION,
  },
  {
    level: 5,
    name: 'Fixi Master',
    minPercent: 75,
    maxPercent: 99,
    accessory: 'sword_shield',
    accessoryLabel: 'Schwert + Schild',
    evolutionImage: FOX_WARRIOR,
  },
  {
    level: 6,
    name: 'Fixi Legend',
    minPercent: 100,
    maxPercent: 100,
    accessory: 'crown',
    accessoryLabel: 'Goldene Krone + Komplette Rüstung',
    evolutionImage: FOX_CHAMPION,
  },
];

export function getFixiLevel(percentPaid: number): FixiLevel {
  if (percentPaid >= 100) return FIXI_LEVELS[5];
  if (percentPaid >= 75) return FIXI_LEVELS[4];
  if (percentPaid >= 50) return FIXI_LEVELS[3];
  if (percentPaid >= 25) return FIXI_LEVELS[2];
  if (percentPaid >= 10) return FIXI_LEVELS[1];
  return FIXI_LEVELS[0];
}
