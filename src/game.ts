import { startAnimation } from "./util/startAnimation";
import { Axis, Vec2 } from "./util/vec2";
import { Box, bumpAdjustV } from "./util/box";
import { Store, store } from "./util/store";
import { between, signedDiffModulo } from "./util/maths";
import { Board } from "./board";
import { increments } from "./util/increments";
import { MoveSet } from "./Moveset";

export interface PlayerCfg {
  moveset: MoveSet,
  colour: string,
  start: Vec2,
  onSpawn: (game: Game, p: PlayerState) => void,
}

export interface GameCfg {
  players: PlayerCfg[],
  entities: EntityCfg[],
  board: Board,
}

export interface PlayerState {
  pos: Vec2,
  v: Vec2,
  cfg: PlayerCfg,
  game: Game,
  id: bigint,
  /** position adjustment due to collisions with walls in previous frame */
  inert_collision?: Vec2 | undefined
  /** position adjustment due to collisions in previous frame */
  collision?: Vec2 | undefined,
}

export interface EntityCfg {
  tick?: undefined | ((entity: EntityState, dt: DOMHighResTimeStamp) => void),
  draw?: undefined | ((entity: EntityState, ctx: CanvasRenderingContext2D) => void),
}

export interface EntityState {
  cfg: EntityCfg,
  id: bigint,
  game: Game,
}

export class Game {
  public players: Store<PlayerState>;
  public entities: Store<EntityState>;
  public ctx: CanvasRenderingContext2D|undefined;
  public BG_COLOR = "#aaa";
  public lastTime: DOMHighResTimeStamp|undefined;

  public stop: (() => void) | undefined;

  public constructor(
    public readonly cfg: GameCfg,
  ) {
    this.players = store();
    this.entities = store();
    for (const pcfg of cfg.players) this.spawn(pcfg);
    for (const ecfg of cfg.entities) this.createEntity(ecfg);
  }

  public createEntity(cfg: EntityCfg): EntityState {
    return this.entities.create(id => ({ cfg, game: this, id }));
  }

  public spawn(cfg: PlayerCfg): PlayerState {
    const pos = cfg.start.add(Vec2.diag(-.5));
    const player = this.players.create(id => ({ cfg, game: this, id, pos, v: Vec2.ZERO }));
    cfg.onSpawn(this, player);
    return player;
  }
  
  private setCtx(canvas: HTMLCanvasElement) {
    this.ctx = getCtx(canvas);
    this.ctx.fillStyle = "#222";
    this.cfg.board.startUnderscan(this.ctx);
  }

  public playOn(canvas: HTMLCanvasElement) {
    console.log("Starting game")
    this.stop?.();
    this.setCtx(canvas);
    const sizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      this.setCtx(canvas);
    });
    sizeObserver.observe(canvas);
    const cancelLoop = startAnimation(time => {
      this.draw();
      this.tick(time);
    })
    this.stop = () => {
      sizeObserver.disconnect();
      cancelLoop();
      this.ctx = undefined;
      this.stop = undefined;
    }
  }

  public draw() {
    if (this.ctx === undefined) throw new Error("Draw requested after stop");
    // Board
    this.ctx.fillStyle = this.BG_COLOR;
    this.cfg.board.drawTiles(this.ctx);
    // Players
    for (const [_, player] of this.players) {
      this.ctx.fillStyle = player.cfg.colour;
      fillArea(this.ctx, playerBox(player));
      const hdg = player.cfg.moveset.getHdgInput();
      if (!hdg.isZero()) fillArea(this.ctx, Box.square(player.pos.add(hdg.scale(0.5)), 0.05));
    }
    // Call entity drawing functions
    for (const [_, entity] of this.entities) entity.cfg.draw?.(entity, this.ctx);
  }

  public tick(currentTime: DOMHighResTimeStamp) {
    const dt = this.lastTime === undefined ? 0 : currentTime - this.lastTime;
    for (const [_, entity] of this.entities) entity.cfg.tick?.(entity, dt);
    for (const [_, player] of this.players) updatePlayer(player, dt);
    this.lastTime = currentTime;
  }
}

export const playerBox = (player: PlayerState): Box =>
  Box.square(player.pos, PLAYER_RADIUS);

export function fillArea(ctx: CanvasRenderingContext2D, b: Box) {
  ctx.fillRect(b.minX(), b.minY(), b.sizeX(), b.sizeY());
}

export function playArea(game: GameCfg): Box {
  return new Box(Vec2.diag(-1), game.board.dimensions().add(Vec2.diag(1)));
}

export const PLAYER_RADIUS = 0.25;

function bump(player: PlayerState, offset: Vec2) {
  player.pos = player.pos.add(offset);
  player.v = bumpAdjustV(offset, player.v);
}

function apply_V(player: PlayerState, dt: number) {
  for (const dP of increments(player.v.scale(dt), PLAYER_RADIUS, 10000)) {
    player.pos = player.pos.add(dP);
    const corners = [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, -1), new Vec2(1, 1)];
    const nearby_boxes = corners.flatMap(offset => {
      const tile_pos = offset.scale(PLAYER_RADIUS).add(player.pos).map(Math.floor);
      if (player.game.cfg.board.getTile(tile_pos) !== "wall") return [];
      const tile_box = new Box(tile_pos, tile_pos.add(Vec2.diag(1)));
      const player_dis_sq = tile_pos.add(Vec2.diag(.5)).sub(player.pos).lensq();
      return [[player_dis_sq, tile_box] as const];
    });
    nearby_boxes.sort((a, b) => a[0] - b[0])
    const old_pos = player.pos;
    for (const [_, box] of nearby_boxes) {
      const offset = box.pushOut(playerBox(player));
      if (offset !== undefined) bump(player, offset);
    }
    player.inert_collision = nearby_boxes.length === 0 ? undefined : old_pos.sub(player.pos);
    const collision_dir = player.inert_collision?.angle();
    for (const [id, other] of player.game.players) {
      if (id === player.id) continue;
      const offset = playerBox(other).pushOut(playerBox(player));
      if (offset !== undefined) {
        let own_conflict_rate: number | undefined;
        let is_blocked = false;
        if (collision_dir !== undefined) {
          own_conflict_rate = Math.abs(signedDiffModulo(collision_dir, offset.angle(), 2 * Math.PI));
          is_blocked = own_conflict_rate <= Math.PI * 1/4;
        }
        let other_conflict_rate: number | undefined;
        let other_blocked = false;
        if (other.inert_collision) {
          const other_collision_dir = other.inert_collision.angle();
          other_conflict_rate = Math.abs((other_collision_dir - offset.scale(-1).angle()) % (2 * Math.PI));
          other_blocked = other_conflict_rate <= Math.PI * 1/4;
        }
        if (!is_blocked && !other_blocked) {
          bump(player, offset.scale(.5));
          bump(other, offset.scale(-.5));
        } else if (!is_blocked) {
          bump(player, offset.scale(.5));
        } else if (!other_blocked) {
          bump(other, offset.scale(-.5));
        } else {
          console.warn("cramming");
          player.v = player.v.map(x => x + Math.random()/5);
          other.v = other.v.map(x => x + Math.random()/5);
        }
      }
    }
    const total_offset = old_pos.sub(player.pos);
    if (total_offset.isZero()) continue;
    player.collision = total_offset;
    return;
  }
  player.collision = undefined;
  return;
}

export function kill(player: PlayerState) {
  player.game.players.delete(player.id);
  console.log(`${player.cfg.colour} died`)
}

function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Could not obtain drawing context");
  return ctx;
}

function updatePlayer(player: PlayerState, dt: DOMHighResTimeStamp) {
  const input = player.cfg.moveset.getMoveInput();
  const MAX_MOVE = 0.01;
  const MAX_Y_MOVE = 0.0005;
  const JUMP_V = 0.0006 * dt;
  const WALLJUMP_V = 0.0005 * dt;
  const ACCEL = 0.00005 * dt;
  const Y_ACCEL = 0.000015 * dt;
  const boundedUpdate = (v: Vec2, axis: Axis, bound: number, change: number) => v.set(axis,
    0 < change
      ? Math.max(v.get(axis), Math.min(bound, v.get(axis) + change))
      : Math.min(v.get(axis), Math.max(-bound, v.get(axis) + change))
  );
  player.v = boundedUpdate(player.v, "x", MAX_MOVE, input.getX() * ACCEL);
  if (input.getY() === -1 && player.collision !== undefined) {
    const floor_jump = between(1 / 4 * Math.PI, player.collision.angle(), 3 / 4 * Math.PI);
    player.v = player.v.setY(floor_jump ? -JUMP_V : -WALLJUMP_V);
  } else {
    player.v = boundedUpdate(player.v, "y", MAX_Y_MOVE, input.getY() * Y_ACCEL);
  }
  // friction
  if (player.collision) {
    const FRICTION_DRAG = Math.pow(0.99, dt);
    // horizontal
    if (player.collision.getY() !== 0 && input.getX() === 0) {
      player.v = player.v.setX(player.v.getX() < 0.000001 ? 0 : player.v.getX() * FRICTION_DRAG);
    }
    // vertical drag
    if (player.collision.getX() !== 0) player.v = player.v.setY(player.v.getY() * FRICTION_DRAG);
  }
  player.v = player.v.add(new Vec2(0, 0.00003 * dt));
  if (!playArea(player.game.cfg).contains(player.pos)) kill(player);
  apply_V(player, dt);
}