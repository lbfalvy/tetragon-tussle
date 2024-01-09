import React from "react";
import "./KeyboardPlayer.scss";
import { KeyInput } from "./KeyInput";
import { key } from "./key";
import { Vec2 } from "../util/vec2";
import { MoveSet, MoveSetClass } from "./Moveset";
import { zip } from "@lbfalvy/array-utils";
import { Variable } from "@lbfalvy/mini-events";

const BUTTONS = ["up", "left", "down", "right", "primary", "secondary"] as const;
type KeyCmd = (typeof BUTTONS)[number];
export type Keybinds = Record<KeyCmd, string>;
export function makeBinds(...keys: string[] & { length: (typeof BUTTONS)["length"]}): Keybinds {
  return Object.fromEntries(zip([...BUTTONS] as KeyCmd[], keys)) as Keybinds
}

export class KeyboardPlayer implements MoveSet {
  class: MoveSetClass = KeyboardPlayer;
  static id = "KeyboardPlayer-0";


  private keyVars: Record<KeyCmd, Variable<boolean>>;
  private lastNonZero: Vec2;
  public constructor(
    public keys: Keybinds,
  ) {
    this.keyVars = Object.fromEntries(
      Object.entries(keys).map(([keyCmd, keyName]) => [keyCmd as KeyCmd, key(keyName)])
    ) as Record<KeyCmd, Variable<boolean>>;
    Object.defineProperty(this, "class", { enumerable: false, value: this.class });
    this.lastNonZero = new Vec2(1, 0);
  }

  getMoveInput(): Vec2 {
    const move = new Vec2(
      (this.keyVars.left.get() ? -1 : 0) + (this.keyVars.right.get() ? 1 : 0),
      (this.keyVars.up.get() ? -1 : 0) + (this.keyVars.down.get() ? 1 : 0),
    );
    if (!move.isZero()) this.lastNonZero = move;
    return move;
  }

  getHdgInput(): Vec2 {
    this.getMoveInput();
    return this.lastNonZero;
  }

  switch(id: string): Variable<boolean> {
    if (id === "primary") return key(this.keys.primary);
    if (id === "secondary") return key(this.keys.secondary);
    throw new Error("Unrecognized switch");
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