import React from "react";
import { Vec2 } from "../util/vec2";
import { MoveSet } from "./Moveset";
import { startAnimation } from "../util/startAnimation";
import { mapMaxIndex } from "@lbfalvy/array-utils";
import { produce } from "immer";
import { Emit, Variable, variable } from "@lbfalvy/mini-events";

export interface GamepadAxis {
  index: number,
  max: number,
  min: number,
}

export const GAMEPAD_AXES = ["v_move", "h_move", "v_look", "h_look"] as const;
export type GamepadAxisRole = (typeof GAMEPAD_AXES)[number];
export const GAMEPAD_BUTTONS = ["primary", "secondary"] as const;
export type GamepadBtnRole = (typeof GAMEPAD_BUTTONS)[number];
export interface GamepadBinds {
  axes: Record<GamepadAxisRole, GamepadAxis>,
  buttons: Record<GamepadBtnRole, number>,
}

export const defaultGamepadBinds: GamepadBinds = {
  buttons: { primary: 0, secondary: 1 },
  axes: {
    h_move: { index: 0, max: 1, min: -1, },
    v_move: { index: 1, max: 1, min: -1, },
    h_look: { index: 3, max: 1, min: -1, },
    v_look: { index: 4, max: 1, min: -1, },
  },
}

function readAxis(gamepad: Gamepad, axis: GamepadAxis): number {
  // this setup is prone to extrapolate accidentally
  const linear = (gamepad.axes[axis.index] - axis.min)
    * 2 / (axis.max - axis.min)
    - 1;
  return Math.min(1, Math.max(-1, linear));
}

function getGamepads(): Gamepad[] {
  return navigator.getGamepads().filter((gp): gp is Gamepad => gp !== null);
}

export const defaultGamepads = (): GamepadPlayer[] =>
  getGamepads().map(gp => new GamepadPlayer(gp.id, defaultGamepadBinds));

export class GamepadPlayer implements MoveSet {
  class = GamepadPlayer;
  static id = "GamepadPlayer";

  public gamepad: Gamepad|undefined;
  private primary: Variable<boolean>;
  private secondary: Variable<boolean>;
  private setPrimary: Emit<[boolean]>;
  private setSecondary: Emit<[boolean]>;
  private stopTrackinng: (() => void) | undefined;

  public constructor(
    public gamepad_id: string,
    public binds: GamepadBinds,
  ) {
    [this.setPrimary, this.primary] = variable(false);
    [this.setSecondary, this.secondary] = variable(false);
    this.gamepad = getGamepads().find(gp => gp.id === gamepad_id);
    window.addEventListener("gamepaddisconnected", ev => {
      if (ev.gamepad.id === gamepad_id) this.stopTrackinng!();
      console.log("Gamepad disconnected");
    });
    window.addEventListener("gamepadconnected", ev => {
      if (ev.gamepad.id === gamepad_id) this.startTracking(ev.gamepad);
      console.log("Gamepad connected");
    })
  }

  public getMoveInput(): Vec2 {
    const { gamepad, binds: { axes: { h_move, v_move } }} = this;
    if (!gamepad) return Vec2.ZERO;
    return new Vec2(readAxis(gamepad, h_move), readAxis(gamepad, v_move));
  }

  public getHdgInput(): Vec2 {
    const { gamepad, binds: { axes: { h_look, v_look } }} = this;
    if (gamepad) {
      const input = new Vec2(readAxis(gamepad, h_look), readAxis(gamepad, v_look));
      if (!input.isZero()) return input;
    }
    return new Vec2(1, 0);
  }

  public switch(id: string): Variable<boolean> {
    if (id === "primary") return this.primary;
    if (id === "secondary") return this.secondary;
    throw new Error("Unrecognized switch");
  }

  public toString(): string {
    return `Gamepad ${this.gamepad?.index ?? this.gamepad_id}`
  }

  public serialize(): string {
    return JSON.stringify([this.gamepad_id, this.binds]);
  }

  public static parse(text: string): MoveSet {
    const [id, binds] = JSON.parse(text) as [string, GamepadBinds];
    return new GamepadPlayer(id, binds);
  }

  private startTracking(gp: Gamepad) {
    this.gamepad = gp;
    const stop = startAnimation(() => {
      this.setPrimary(gp.buttons[this.binds.buttons.primary].pressed);
      this.setSecondary(gp.buttons[this.binds.buttons.secondary].pressed);
    });
    this.stopTrackinng = () => {
      stop();
      this.gamepad = undefined;
      this.stopTrackinng = undefined;
    }
  }
}

export interface GamepadPlayerEditorProps {
  value: GamepadPlayer,
  onChange: (value: GamepadPlayer) => void
}

export function GamepadPlayerEditor({ value, onChange }: GamepadPlayerEditorProps): React.ReactElement {
  const gamepads = useGamepads();
  const [btnCount, setBtnCount] = React.useState(value.gamepad?.buttons.filter(b => b.pressed).length);
  const [scanByButtons, setScanByButtons] = React.useState(false);
  function process() {
    setBtnCount(value.gamepad?.buttons.filter(b => b.pressed).length);
    if (scanByButtons) {
      const newGamepad = gamepads.find(gp => 3 <= gp.buttons.filter(b => b.pressed).length);
      if (newGamepad) {
        onChange(new GamepadPlayer(newGamepad.id, value.binds));
        setScanByButtons(false);
      }
    }
  }
  const processRef = React.useRef(process);
  processRef.current = process;
  React.useEffect(() => {
    const interval = setInterval(() => processRef.current(), 100);
    return () => clearInterval(interval);
  }, []);
  const gamepad = value.gamepad;
  return <span className="GamepadPlayerEditor">
    <div>{btnCount === undefined ? "Gamepad disconnected" : `Receiving ${btnCount} buttons`}</div>
    <button onClick={() => setScanByButtons(!scanByButtons)}>
      {scanByButtons ? "Press 3 or more buttons" : "Detect gamepad by buttons"}
    </button>
    {gamepad? <div className="binds">
      {GAMEPAD_AXES.map(x => <div key={x}>
        {x}
        <GamepadAxisPicker negName={`${x}_min`} posName={`${x}_max`}
          gamepad={gamepad} axis={value.binds.axes[x]}
          onChange={axis => {
            const binds = produce(value.binds, b => { b.axes[x] = axis });
            onChange(new GamepadPlayer(value.gamepad_id, binds))
          }}
           />
      </div>)}
    </div> :null}
  </span>
}

interface GamepadAxisPickerProps {
  gamepad: Gamepad,
  axis: GamepadAxis,
  posName: string,
  negName: string,
  onChange: (axis: GamepadAxis) => void,
}

function GamepadAxisPicker({ gamepad, axis, onChange, posName, negName }: GamepadAxisPickerProps): React.ReactElement {
  const STEP_TIME = 2000;
  const [value, setValue] = React.useState(readAxis(gamepad, axis));
  const limits = React.useRef<[number, number][]>([]);
  React.useLayoutEffect(() => {
    limits.current = gamepad.axes.map(_ => [Infinity, -Infinity]);
  }, [gamepad]);
  const [candidate, setCandidate] = React.useState<number>();
  const [start, setStart] = React.useState<number>();
  const [max, setMax] = React.useState<number>();
  const reset = React.useCallback(() => {
    setCandidate(undefined);
    setStart(undefined);
    setMax(undefined);
  }, []);
  function process() {
    if (start === undefined) return setValue(readAxis(gamepad, axis)/2+.5);
    const time_elapsed = Date.now() - start;
    if (time_elapsed < STEP_TIME) {
      let reload = false;
      limits.current.forEach((range, i) => {
        if (gamepad.axes[i] < range[0]) { reload ||= true; range[0] = gamepad.axes[i]; }
        if (range[1] < gamepad.axes[i]) { reload ||= true; range[1] = gamepad.axes[i]; }
      });
      return setValue(STEP_TIME - time_elapsed);
    }
    if (candidate === undefined)
      return setCandidate(mapMaxIndex(limits.current, ([min, max]) => Math.abs(max - min)));
    if (time_elapsed < 2*STEP_TIME) return setValue(STEP_TIME * 2 - time_elapsed);
    if (max === undefined) return setMax(gamepad.axes[candidate]);
    if (time_elapsed < 3*STEP_TIME) return setValue(STEP_TIME * 3 - time_elapsed);
    const min = gamepad.axes[candidate];
    onChange({ index: candidate, min, max });
    reset();
  }
  const processRef = React.useRef(process);
  processRef.current = process;
  React.useEffect(() => startAnimation(() => processRef.current()), []);
  return <button onClick={() => {
    if (start === undefined) setStart(Date.now());
    else reset();
  }}>
      {start === undefined? <>
        Axis {axis.index}
        {Math.round(axis.min*100)/100} -&gt; {Math.round(axis.max*100)/100}
      </>
        :candidate === undefined? <>Wiggle the desired axis</>
        :max === undefined? <>Move the axis all the way {posName}</>
        :<>Move the axis all the way {negName}</>
      }
    <meter value={value} max={1} />
  </button>
}

export function useGamepads(): Gamepad[] {
  const [gamepads, setGamepads] = React.useState(getGamepads());
  React.useEffect(() => {
    const handler = () => setGamepads(getGamepads());
    addEventListener("gamepadconnected", handler);
    addEventListener("gamepaddisconnected", handler);
    return () => {
      removeEventListener("gamepadconnected", handler);
      removeEventListener("gamepaddisconnected", handler);
    }
  }, []);
  return gamepads;
}
