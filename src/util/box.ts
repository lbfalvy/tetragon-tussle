import { between } from "./maths";
import { Axis, Vec2 } from "./vec2";

/** Represent a box with the top left and bottom right cotner */
export class Box {
  public constructor(
    private readonly min: Vec2,
    private readonly max: Vec2,
  ) {}
  public getMin(): Vec2 { return this.min }
  public getMax(): Vec2 { return this.max }

  public toString(): string { return `box(${this.getMin()}, ${this.getMax()})` }
  public static readonly EMPTY: Box = new Box(Vec2.ZERO, Vec2.ZERO);

  public minX(): number { return this.getMin().getX() }
  public maxX(): number { return this.getMax().getX() }
  public minY(): number { return this.getMin().getY() }
  public maxY(): number { return this.getMax().getY() }
  public sizeX(): number { return this.maxX() - this.minX() }
  public sizeY(): number { return this.maxY() - this.minY() }
  public equals(other: Box): boolean {
    return this.getMin().equals(other.getMin()) && this.getMax().equals(other.getMax());
  }
  public contains(p: Vec2): boolean {
    return Vec2.AXES.every(x => between(this.getMin().get(x), p.get(x), this.getMax().getX()));
  }

  public static square(center: Vec2, radius: number): Box {
    const diag = new Vec2(radius, radius);
    return new Box(center.add(diag.scale(-1)), center.add(diag));
  }

  /// Push a collider out of a box. Also zero the axis of velocity corresponding to the colliding side.
  public pushOut(collider: Box): Vec2 | undefined {
    const xneg_inset = collider.maxX() - this.minX();
    if (xneg_inset <= 0) return undefined;
    const xpos_inset = this.maxX() - collider.minX();
    if (xpos_inset <= 0) return undefined;
    const yneg_inset = collider.maxY() - this.minY();
    if (yneg_inset <= 0) return undefined;
    const ypos_inset = this.maxY() - collider.minY();
    if (ypos_inset <= 0) return undefined;
    type Inset = readonly [number, () => Vec2];
    const insets: Inset[] = [
      [xneg_inset, () => new Vec2(-xneg_inset, 0)],
      [xpos_inset, () => new Vec2(+xpos_inset, 0)],
      [yneg_inset, () => new Vec2(0, -yneg_inset)],
      [ypos_inset, () => new Vec2(0, +ypos_inset)],
    ];
    let max_inset: Inset = [Infinity, () => {throw new Error("Unreachable default case")}];
    for (const inset of insets) if (inset[0] < max_inset[0]) max_inset = inset;
    return max_inset[1]();
  }

  public overlap(other: Box): Box {
    const xmin = Math.max(this.minX(), other.minX());
    const xmax = Math.min(this.maxX(), other.maxX());
    if (xmax < xmin) return Box.EMPTY;
    const ymin = Math.max(this.minY(), other.minY());
    const ymax = Math.min(this.maxY(), other.maxY());
    if (ymax < ymin) return Box.EMPTY;
    return new Box(new Vec2(xmin, ymin), new Vec2(xmax, ymax));
  }

  public area(): number {
    return this.sizeX() * this.sizeY();
  }

  public isEmpty(): boolean {
    return this.sizeX() === 0 || this.sizeY() === 0;
  }
}

export type NumDir = "min" | "max";

export function bumpAdjustV(bump: Vec2, v: Vec2): Vec2 {
  const proc = (axis: Axis) => {
    const b = bump.get(axis), x = v.get(axis);
    return b === 0 ? x : (b < 0 ? Math.min : Math.max)(x, 0);
  }
  return new Vec2(proc("x"), proc("y"));
}

// interface BoxPushResult { side:  }