import React from "react";
import "./KeyboardPlayer.scss";
import { KeyInput } from "./KeyInput";
import { getKey } from "./keystates";
import { Vec2 } from "./util/vec2";
import { MoveSet } from "./Moveset";

export class KeyboardPlayer implements MoveSet {
  class = KeyboardPlayer;
  static id = "KeyboardPlayer-0";

  private lastNonZero: Vec2;
  public constructor(
    public up: string,
    public left: string,
    public down: string,
    public right: string,
    public primary: string,
    public secondary: string
  ) {
    Object.defineProperty(this, "class", { enumerable: false, value: this.class });
    this.lastNonZero = new Vec2(1, 0);
  }

  getMoveInput(): Vec2 {
    const move = new Vec2(
      (getKey(this.left) ? -1 : 0) + (getKey(this.right) ? 1 : 0),
      (getKey(this.up) ? -1 : 0) + (getKey(this.down) ? 1 : 0),
    );
    if (!move.isZero()) this.lastNonZero = move;
    return move;
  }

  getHdgInput(): Vec2 {
    this.getMoveInput();
    return this.lastNonZero;
  }

  getSwitch(id: string): boolean {
    if (id === "primary") return getKey(this.primary);
    if (id === "secondary") return getKey(this.secondary);
    return false;
  }

  toString(): string {
    const {up, left, down, right, primary, secondary} = this;
    return `${up}/${left}/${down}/${right}, ${primary} & ${secondary}`;
  }

  serialize(): string {
    const {up, left, down, right, primary, secondary} = this;
    return JSON.stringify({up, left, down, right, primary, secondary});
  }

  static parse(str: string): KeyboardPlayer {
    const data = JSON.parse(str) as Record<string, string>;
    return new KeyboardPlayer(data.up, data.down, data.left, data.right, data.primary, data.secondary);
  }
}

const BUTTONS = ["up", "left", "down", "right", "primary", "secondary"] as const;

interface KeyboardPlayerEditorProps {
  value: KeyboardPlayer,
  onChange: (value: KeyboardPlayer) => void
}

export function KeyboardPlayerEditor({ value, onChange }: KeyboardPlayerEditorProps): React.ReactElement {
  return <span className="KeyboardPlayerEditor">
    {BUTTONS.map(button => <label key={button}>
      <span>{button[0].toUpperCase()}{button.slice(1)}: </span>
      <KeyInput
        value={value[button]}
        onChange={key => onChange(Object.assign(value, { [button]: key }))}
      />
    </label>)}
  </span>
}