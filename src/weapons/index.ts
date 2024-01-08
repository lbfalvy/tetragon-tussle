import { EntityCfg, PlayerState } from "../Game";
import { Gun } from "./gun";

// todo: figure out a system for weapons:
// - serializable/dispatchable like input methods
// - only exists at runtime, the only thing being saved and loaded is the variant

export interface Weapon extends EntityCfg {
  readonly class: WeaponClass,
}

export interface WeaponClass {
  id: string,
  instantiate(player: PlayerState, trigger: string): Weapon,
}

export const WEAPONS = [
  Gun,
] as const;