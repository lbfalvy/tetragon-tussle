import React from "react";
import "./Init.scss";
import { KeyInput } from "./KeyInput";
import { KeyList, ListEdit } from "./ListEdit";
import { EntityCfg, GameCfg } from "./game";
import { Board } from "./board";
import { kbdMoveset } from "./kbdMoveset";
import { Vec2 } from "./util/vec2";
import { makeRevolver } from "./weapons.ts/revolver";

interface PlayerConfig {
  colour: string,
  up: string,
  left: string,
  down: string,
  right: string,
  primary: string,
  secondary: string,
}

interface UserConfigProps { value: PlayerConfig, onChange: (pc: PlayerConfig | undefined) => void }

const COLOURS = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "W0ff"];

const playerCountContext = React.createContext(0);

export function PlayerForm({ value, onChange }: UserConfigProps): React.ReactElement {
  const playerCount = React.useContext(playerCountContext);
  return <div className="PlayerForm">
    <span className="color-sample"
      style={{ backgroundColor: value.colour }}
      onClick={() => {
        const colour = COLOURS[(COLOURS.indexOf(value.colour) + 1) % COLOURS.length];
        onChange({ ...value, colour });
      }} />
    <label>Up: <KeyInput value={value.up} onChange={up => onChange({ ...value, up })} /></label>
    <label>Left: <KeyInput value={value.left} onChange={left => onChange({ ...value, left })} /></label>
    <label>Down: <KeyInput value={value.down} onChange={down => onChange({ ...value, down })} /></label>
    <label>Right: <KeyInput value={value.right} onChange={right => onChange({ ...value, right })} /></label>
    {2 < playerCount ?
      <button className="delete" onClick={() => onChange(undefined)}>Delete</button>
    :null}
  </div>
}

interface Map {
  board: Board,
  entities: EntityCfg[],
  spawn_points: Vec2[],
}

interface InitProps {
  onSubmit(cfg: GameCfg): void;
}

export function Init({ onSubmit }: InitProps): React.ReactElement {
  const [players, setPlayers] = React.useState<KeyList<PlayerConfig>>(KeyList.new([
    { colour: COLOURS[0], up: "w", left: "a", down: "s", right: "d", primary: "v", secondary: "b" },
    { colour: COLOURS[1], up: "ArrowUp", left: "ArrowLeft", down: "ArrowDown", right: "ArrowRight", primary: "l", secondary: "k" },
  ]));
  const [mapId, _setMapId] = React.useState(0);
  return <playerCountContext.Provider value={players.length()}>
    <div className="Init">
      {players.length() < Math.min(COLOURS.length, MAPS[mapId].spawn_points.length) ?
        <button onClick={() => {
          const colour = COLOURS.find(c => players.entries().every(p => p[1].colour !== c));
          if (colour === undefined) throw new Error("Impossible");
          setPlayers(players.push({ colour, up: "none", down: "none", left: "none", right: "none", primary: "none", secondary: "none" }));
        }}>Add player</button>
      :null}
    </div>
    <ListEdit value={players} onChange={setPlayers} Row={PlayerForm} />
    <button onClick={() => {
      const map = MAPS[mapId];
      onSubmit({
        players: players.values().map((pc, i) => ({
          colour: pc.colour,
          moveset: kbdMoveset(pc.up, pc.down, pc.left, pc.right),
          start: map.spawn_points[i],
          onSpawn(game, player) {
            makeRevolver(game, player, pc.primary);
          }
        })),
        entities: map.entities,
        board: map.board
      })
    }}>Launch game</button>
  </playerCountContext.Provider>
}

const MAPS: Map[] = [
  {
    entities: [],
    spawn_points: [new Vec2(3, 3), new Vec2(14, 3), new Vec2(4, 6), new Vec2(13, 6)],
    board: Board.parse(`
          . . . . . . . . . . . . . . . .
          . . . . . . . . . . . . . . . .
          . . . . . . . . . . . . . . . .
          w w w w . . . w . . . . w w w w
          . . . . . . . . w . . . . . . .
          . . . . . . . w w . . . . . . .
          . . w w w w . w w w w w w w . .
          . . . . . . w . . . . . . . . .
          . . . . . . . . . . . . . . . .
        `)
  }
]