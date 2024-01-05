import React from "react";
import "./Init.scss";
import { KeyList, ListEdit } from "./ListEdit";
import { EntityCfg, GameCfg } from "./game";
import { Board } from "./board";
import { Vec2 } from "./util/vec2";
import { makeRevolver } from "./weapons.ts/revolver";
import { EditMoveset, MoveSet, defaultInputs, parseMoveSet, serializeMoveSet } from "./Moveset";

interface PlayerConfig {
  color: string,
  moveset: MoveSet,
}

interface UserConfigProps { value: PlayerConfig, onChange: (pc: PlayerConfig | undefined) => void }

const COLOURS = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff"];

const playerCountContext = React.createContext(0);

export function PlayerForm({ value, onChange }: UserConfigProps): React.ReactElement {
  const playerCount = React.useContext(playerCountContext);
  return <div className="PlayerForm">
    <button className="color-sample"
      style={{ backgroundColor: value.color }}
      onClick={() => {
        const colour = COLOURS[(COLOURS.indexOf(value.color) + 1) % COLOURS.length];
        onChange({ ...value, color: colour });
      }} />
    <EditMoveset value={value.moveset} onChange={moveset => onChange({ ...value, moveset })} />
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

const LSKEY = "tetragon-tussle-player-list-0";
type StoredPlayers = { color: string, moveset: string }[];
const defaultPlayers = (): PlayerConfig[] => [
  { color: COLOURS[0], moveset: defaultInputs()[0] },
  { color: COLOURS[1], moveset: defaultInputs()[1] },
]
function loadPlayers(): PlayerConfig[] {
  const str = localStorage.getItem(LSKEY);
  if (str === null) return defaultPlayers();
  const stored = JSON.parse(str) as StoredPlayers;
  return stored.map(({ color, moveset }) => ({ color, moveset: parseMoveSet(moveset) }));
}
function savePlayers(pcs: PlayerConfig[]) {
  const stored: StoredPlayers = pcs.map(({ color, moveset }) => ({ color, moveset: serializeMoveSet(moveset) }));
  localStorage.setItem(LSKEY, JSON.stringify(stored))
}

export function Init({ onSubmit }: InitProps): React.ReactElement {
  const [players, setPlayers] = React.useState<KeyList<PlayerConfig>>(() => KeyList.new(loadPlayers()));
  const [mapId, _setMapId] = React.useState(0);
  return <playerCountContext.Provider value={players.length()}>
    <div className="Init">
      {players.length() < Math.min(COLOURS.length, MAPS[mapId].spawn_points.length) ?
        <button onClick={() => {
          const colour = COLOURS.find(c => players.entries().every(p => p[1].color !== c));
          if (colour === undefined) throw new Error("Impossible");
          setPlayers(players.push({ color: colour, moveset: defaultInputs()[0] }));
        }}>Add player</button>
      :null}
      <button onClick={() => setPlayers(KeyList.new(defaultPlayers()))}>Load default</button>
      <button onClick={() => {
        savePlayers(players.values());
        const map = MAPS[mapId];
        onSubmit({
          players: players.values().map((pc, i) => ({
            colour: pc.color,
            moveset: pc.moveset,
            start: map.spawn_points[i],
            onSpawn(game, player) {
              makeRevolver(game, player, "primary");
            }
          })),
          entities: map.entities,
          board: map.board
        })
      }}>Launch game</button>
      <div className="player-list">
        <ListEdit value={players} onChange={setPlayers} Row={PlayerForm} />
      </div>
    </div>
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