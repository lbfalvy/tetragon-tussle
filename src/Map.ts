import { zip } from "@lbfalvy/array-utils";
import { EntityCfg, PLAYER_RADIUS } from "./Game";
import { fillArea, withCtx } from "./util/canvas";
import { Axis, Vec2 } from "./util/vec2";
import { Box } from "./util/box";

export type Tile =
  | undefined
  | "wall";

export class Board {
  private constructor(
    private readonly size: Vec2,
    private readonly tiles: readonly (readonly Tile[])[]
  ) {}

  public static new(tiles: (readonly Tile[])[]): Board {
    if (tiles[tiles.length - 1].length === 0) tiles.pop();
    if (tiles.length === 0) throw new Error("Empty board");
    const y = tiles.length;
    const x = tiles[0].length;
    tiles.forEach((row, i) => {
      if (row.length !== x) throw new Error(`Row ${i} isn't ${x} tiles long like row 0`);
    })
    return new Board(new Vec2(x, y), tiles);
  }

  public dimensions(): Vec2 { return this.size }

  public tileList(): (readonly [number, number, Tile])[] {
    return this.tiles.flatMap((row, y) => row.map((tile, x) => [x, y, tile] as const))
  }

  public getTile(pos: Vec2): Tile {
    const y = Math.floor(pos.getY());
    if (y < 0 || this.size.getY() <= y) return undefined;
    const x = Math.floor(pos.getX());
    if (x < 0 || this.size.getX() <= x) return undefined;
    if (!(y in this.tiles)) {
      throw new Error(`Everything's fucked: ${JSON.stringify(this)}, ${x}, ${y}`)
    }
    return this.tiles[y][x];
  }

  public static parse(chars: string): Board {
    return Board.new(chars.split("\n")
      .map(s => s.trim())
      .filter(s => 0 < s.length)
      .map(s => s.split(" ").flatMap(c => {
        if (c === ".") return [undefined];
        if (c === "w") return ["wall"] as const;
        throw new Error(`Unrecognized tile: "${c}"`);
      }))
    );
  }

  public serialize(): string {
    return this.tiles.map(row => row.map(t => t === "wall" ? "w" : ".").join(" ")).join("\n");
  }

  public startUnderscan(ctx: CanvasRenderingContext2D): [Axis, number] {
    if (ctx.canvas.width * ctx.canvas.height === 0) return ["x", 0];
    const canvasSize = new Vec2(ctx.canvas.width, ctx.canvas.height);
    const canvasAR = canvasSize.tan();
    const boardAR = this.dimensions().tan();
    const axis = boardAR < canvasAR ? "x" : "y";
    let display_scale: number;
    let display_offset: Vec2;
    let amount: number;
    if (axis === "x") {
      amount = (canvasAR - boardAR) * canvasSize.getY() / 2;
      display_scale = canvasSize.getY() / this.dimensions().getY();
      display_offset = new Vec2(amount, 0);
    } else {
      amount = canvasSize.getX() / 2 * (1 / canvasAR - 1 / boardAR);
      display_scale = canvasSize.getX() / this.dimensions().getX();
      display_offset = new Vec2(0, amount);
    }
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(display_offset.getX(), display_offset.getY());
    ctx.scale(display_scale, display_scale);
    const drawing_area = new Path2D();
    drawing_area.rect(0, 0, ...this.dimensions().toPair());
    ctx.clip(drawing_area, "nonzero");
    return [axis, amount];
  }

  public drawTiles(ctx: CanvasRenderingContext2D, bg: string, fg: string) {
    ctx.fillStyle = bg
    // Background
    ctx.fillRect(0, 0, this.dimensions().getX(), this.dimensions().getY());
    // Tiles
    for (const [x, y, tile] of this.tileList()) {
      if (tile === undefined) continue;
      ctx.fillStyle = fg;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

export interface Map {
  board: Board,
  entities: EntityCfg[],
  spawn_points: Vec2[],
}

export const MAPS: Map[] = [
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
  },
  {
    entities: [],
    spawn_points: [new Vec2(3, 3), new Vec2(14, 3), new Vec2(4, 6), new Vec2(13, 6)],
    board: Board.parse(`
      w w w w w w w w w w w w w w w w
      w . . . . . . . . . . . . . . w
      w . . . . . . . . . . . . . . w
      w w w w . . . w . . . . w w w w
      w . . . . . . . w . . . . . . w
      w . . . . . . w w . . . . . . w
      w . w w w w . w w w w w w w . w
      w . . . . . w . . . . . . . . w
      w w w w w w w w w w w w w w w w
    `)
  }
]

export function drawMap(map: Map, canvas: HTMLCanvasElement): () => void {
  return withCtx(canvas, ctx => {
    const playerColours = ["#00f", "#44f", "#66f", "#88f"];
    map.board.startUnderscan(ctx);
    map.board.drawTiles(ctx, "#aaa", "#fff");
    for (const ent of map.entities) ent.draw?.(ctx);
    for (const [pos, colour] of zip(map.spawn_points, playerColours)) {
      ctx.fillStyle = colour;
      fillArea(ctx, Box.square(pos.sub(Vec2.diag(0.5)), PLAYER_RADIUS));
    }
  });
}

