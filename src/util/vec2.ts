export class Vec2 {
  /// constructor and accessors
  public constructor(
    private readonly x: number,
    private readonly y: number,
  ) {
     if (Number.isNaN(x) || Number.isNaN(y)) throw new Error("Vector can't have NaN field");
  }
  public getX(): number { return this.x }
  public getY(): number { return this.y }

  // operators
  public setX(x: number): Vec2 { return new Vec2(x, this.getY()) }
  public setY(y: number): Vec2 { return new Vec2(this.getX(), y) }
  public map(f: (n: number) => number): Vec2 { return new Vec2(f(this.getX()), f(this.getY())) }
  public add(other: Vec2): Vec2 { return new Vec2(this.getX() + other.getX(), this.getY() + other.getY()) }
  public scale(n: number): Vec2 { return this.map(x => x * n) }
  public sub(other: Vec2): Vec2 { return this.add(other.scale(-1)) }
  public normalize(): Vec2 { return this.isZero() ? Vec2.ZERO : this.scale(1/this.length()) }

  // queries
  public toString(): string { return `(${this.getX()};${this.getY()})` }
  public lensq(): number { return this.getX() * this.getX() + this.getY() * this.getY() }
  public length(): number { return Math.sqrt(this.lensq()) }
  public tan(): number { return this.getX() / this.getY() }
  public angle(): number { return Math.atan2(this.getY(), this.getX())}
  public toPair(): [number, number] { return [this.getX(), this.getY()] }
  public equals(other: Vec2): boolean {
    return this.getX() === other.getX() && this.getY() === other.getY()
  }
  
  // reflect
  public get(axis: Axis): number { return axis === "x" ? this.getX() : this.getY(); }
  public set(axis: Axis, n: number): Vec2 { return axis === "x" ? this.setX(n) : this.setY(n); }
  public static readonly AXES: Axis[] = ["x", "y"];

  // special cases
  public static readonly ZERO: Vec2 = new Vec2(0, 0);
  public isZero(): boolean { return this.getX() === 0 && this.getY() === 0 }
  public static diag(n: number): Vec2 { return new Vec2(n, n) }
}

export type Axis = "x" | "y";