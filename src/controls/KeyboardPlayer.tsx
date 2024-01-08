import React from "react";
import "./KeyboardPlayer.scss";
import { KeyInput } from "./KeyInput";
import { getKey } from "./getKey";
import { Vec2 } from "../util/vec2";
import { MoveSet, MoveSetClass } from "./Moveset";
import { zip } from "@lbfalvy/array-utils";

const BUTTONS = ["up", "left", "down", "right", "primary", "secondary"] as const;
type KeyCmd = (typeof BUTTONS)[number];
export type Keybinds = Record<KeyCmd, string>;
export function makeBinds(...keys: string[] & { length: (typeof BUTTONS)["length"]}): Keybinds {
  return Object.fromEntries(zip([...BUTTONS] as KeyCmd[], keys)) as Keybinds
}

export class KeyboardPlayer implements MoveSet {
  class: MoveSetClass = KeyboardPlayer;
  static id = "KeyboardPlayer-0";

  private lastNonZero: Vec2;
  public constructor(
    public keys: Keybinds,
  ) {
    Object.defineProperty(this, "class", { enumerable: false, value: this.class });
    this.lastNonZero = new Vec2(1, 0);
  }

  getMoveInput(): Vec2 {
    const move = new Vec2(
      (getKey(this.keys.left) ? -1 : 0) + (getKey(this.keys.right) ? 1 : 0),
      (getKey(this.keys.up) ? -1 : 0) + (getKey(this.keys.down) ? 1 : 0),
    );
    if (!move.isZero()) this.lastNonZero = move;
    return move;
  }

  getHdgInput(): Vec2 {
    this.getMoveInput();
    return this.lastNonZero;
  }

  getSwitch(id: string): boolean {
    if (id === "primary") return getKey(this.keys.primary);
    if (id === "secondary") return getKey(this.keys.secondary);
    return false;
  }

  toString(): string {
    const {up, left, down, right, primary, secondary} = this.keys;
    return `${up}/${left}/${down}/${right}, ${primary} & ${secondary}`;
  }

  serialize(): string {
    return JSON.stringify(this.keys);
  }

  static parse(str: string): KeyboardPlayer {
    return new KeyboardPlayer(JSON.parse(str) as Keybinds);
  }
}

interface KeyboardPlayerEditorProps {
  value: KeyboardPlayer,
  onChange: (value: KeyboardPlayer) => void
}

export function KeyboardPlayerEditor({ value, onChange }: KeyboardPlayerEditorProps): React.ReactElement {
  return <span className="KeyboardPlayerEditor">
    {BUTTONS.map(button => <label key={button}>
      <span>{button[0].toUpperCase()}{button.slice(1)}: </span>
      <KeyInput
        value={value.keys[button]}
        onChange={key => {
          const binds = Object.assign({ [button]: key }, value.keys);
          onChange(new KeyboardPlayer(binds))
        }}
      />
    </label>)}
  </span>
}