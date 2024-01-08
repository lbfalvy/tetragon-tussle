import React from "react";
import "./Moveset.scss";
import { KeyboardPlayer, KeyboardPlayerEditor, makeBinds } from "./KeyboardPlayer";
import { Vec2 } from "../util/vec2";
import { classList } from "@lbfalvy/react-utils";
import { GamepadPlayer, GamepadPlayerEditor, defaultGamepads, useGamepads } from "./GamepadPlayer";

export interface MoveSet {
  getHdgInput(): Vec2;
  getMoveInput(): Vec2;
  getSwitch(id: string): boolean;
  serialize(): string;
  toString(): string;
  readonly class: MoveSetClass;
}

export interface MoveSetClass {
  id: string;
  parse(s: string): MoveSet;
}

const LSVariants = [
  KeyboardPlayer,
  GamepadPlayer,
] as MoveSetClass[];

const LSKEY = "tetragon-tussle-input-configs-0";

export const defaultInputs = (): MoveSet[] => [
  new KeyboardPlayer(makeBinds("w", "a", "s", "d", "v", "b")),
  new KeyboardPlayer(makeBinds("ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "l", "k")),
  ...defaultGamepads(),
];

export function parseMoveSet(text: string): MoveSet { 
  const [variant, data] = JSON.parse(text) as [string, string];
  const cls = LSVariants.find(cls => cls.id === variant);
  if (cls === undefined) throw new Error("Unrecognized variant");
  return cls.parse(data);
}

export function serializeMoveSet(ms: MoveSet): string {
  return JSON.stringify([ms.class.id, ms.serialize()]);
}

export function loadInputConfigs(): MoveSet[] {
  const str = localStorage.getItem(LSKEY);
  const saved = str !== null ? JSON.parse(str) as string[] : [];
  return [...defaultInputs(), ...saved.map(parseMoveSet)];
}

export function saveInputConfigs(movesets: MoveSet[]) {
  const defaults = defaultInputs();
  const candidates = movesets.filter(mov => defaults.includes(mov)).map(serializeMoveSet);
  const saved = JSON.stringify([...new Set(candidates)]);
  localStorage.setItem(LSKEY, saved);
}

function useInputConfigs(): MoveSet[] {
  useGamepads();
  return defaultInputs();
}

interface EditMovesetProps {
  value: MoveSet,
  onChange: (v: MoveSet) => void
}

export function EditMoveset({ value, onChange }: EditMovesetProps): React.ReactElement {
  const [ddOpen, setDdOpen] = React.useState(false);
  return <span className={classList("EditMoveset", ddOpen && "dropdown-open")}>
    <span className="dropdown">
      <button className="open-button" onClick={() => setDdOpen(true)}>Select a preset</button>
      <div className="dropdown-contents">
        <button onClick={() => setDdOpen(false)}>Cancel</button>
        {useInputConfigs().map((ms, i) => <React.Fragment key={i}>
          <button onClick={() => {
            onChange(ms);
            setDdOpen(false);
          }}>{ms.toString()}</button>
        </React.Fragment>)}
      </div>
    </span>
    <span className="edit">
      {value instanceof KeyboardPlayer?
        <KeyboardPlayerEditor value={value} onChange={input => onChange(input)} />
      :value instanceof GamepadPlayer?
        <GamepadPlayerEditor value={value} onChange={input => onChange(input)} />
      :<>Cannot edit unrecognized input method. Pick a default to modify.</>}
    </span>
  </span>
}