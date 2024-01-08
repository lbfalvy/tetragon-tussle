import React from "react";
import "./Init.scss";
import { KeyList, ListEdit } from "./ListEdit";
import { GameCfg } from "./Game";
import { MAPS, drawMap } from "./Map";
import { Gun } from "./weapons/gun";
import { EditMoveset, MoveSet, defaultInputs, parseMoveSet, serializeMoveSet } from "./controls/Moveset";
import { classList } from "@lbfalvy/react-utils";
import { Shield } from "./weapons/shield";

interface PlayerConfig {
  color: string,
  moveset: MoveSet,
}

interface UserConfigProps { value: PlayerConfig, onChange: (pc: PlayerConfig | undefined) => void }

const COLOURS = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff"];

export function lighten(color: string): string {
  return `${color.replaceAll('0', '8')}8`;
}

export function halfLighten(color: string): string {
  return `${color.replaceAll('f', '8')}c`;
}

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
  const [mapId, setMapId] = React.useState(0);
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
      <button autoFocus onClick={() => {
        savePlayers(players.values());
        const map = MAPS[mapId];
        onSubmit({
          players: players.values().map((pc, i) => ({
            ...pc,
            color_light: lighten(pc.color),
            color_mid: halfLighten(pc.color),
            start: map.spawn_points[i],
            onSpawn(game, player) {
              const g = game.createEntity(new Gun(player, "primary"));
              const s = game.createEntity(new Shield(player, "secondary"));
              return () => { game.entities.delete(g.id); game.entities.delete(s.id); }
            }
          })),
          entities: map.entities,
          board: map.board
        })
      }}>Launch game</button>
      <div className="player-list">
        <ListEdit value={players} onChange={setPlayers} Row={PlayerForm} />
      </div>
      <div className="map-list">
        {MAPS.map((map, i) => {
          const canvasRef = React.useRef<HTMLCanvasElement>(null);
          React.useEffect(() => {
            if (canvasRef.current === null) return;
            return drawMap(map, canvasRef.current);
          }, []);
          return <button key={i}
            onClick={() => setMapId(i)}
            className={classList(i === mapId && "active")}
          >
            <canvas ref={canvasRef} />
          </button>}
        )}
      </div>
    </div>
  </playerCountContext.Provider>
}

