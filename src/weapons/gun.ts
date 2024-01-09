import { Weapon, WeaponClass } from ".";
import { EntityCfg, EntityState, PLAYER_RADIUS, PlayerCfg, PlayerState, playArea, playerBox } from "../Game";
import { Tile } from "../Map";
import { Box } from "../util/box";
import { fillArea } from "../util/canvas";
import { Vec2 } from "../util/vec2";

export class Gun implements Weapon {
  public readonly class: WeaponClass = Gun;
  static readonly id = "BasicGun";
  public readonly bullet_v = 0.04;
  public readonly shot_time = 300;
  public readonly clip_size = 6;
  public readonly reload_time = 1000;
  public readonly bullet_radius = 0.05;
  public readonly knockback = 0.005;

  constructor(
    public readonly player: PlayerState,
    public readonly trigger: string,
  ) {}

  public time_since_last_shot = 0;
  public clip = this.clip_size;
  public readonly game = this.player.game;
  
  public tick(_: EntityState, dt: number) {
    this.time_since_last_shot += dt;
    if (
      this.clip === 0
      || !this.player.cfg.moveset.switch(this.trigger).get()
      || this.time_since_last_shot <= this.shot_time
    ) return;
    this.shoot();
  }

  public mkBullet(): EntityCfg {
    const hdg = this.player.cfg.moveset.getHdgInput();
    const v = hdg.normalize().scale(this.bullet_v).add(this.player.v);
    const knockback_v = hdg.normalize().scale(-this.knockback);
    this.player.v = this.player.v.add(knockback_v);
    const pos = hdg.scale(this.bullet_radius + PLAYER_RADIUS + 0.01).add(this.player.pos);
    return new Bullet(v, pos, this.player.cfg, this.bullet_radius, this.knockback);
  }

  public shoot() {
    this.time_since_last_shot = 0;
    if (--this.clip === 0) setTimeout(() => this.clip = this.clip_size, this.reload_time);
    this.game.createEntity(this.mkBullet());
  }

  public static instantiate(player: PlayerState, trigger: string): Weapon {
    return new this(player, trigger);
  }
}

export class Bullet implements EntityCfg {
  public constructor(
    public v: Vec2,
    public pos: Vec2,
    public readonly firedBy: PlayerCfg,
    public readonly radius: number,
    public readonly knockback: number,
  ) {}

  public diverge(ent: EntityState) {
    ent.game.destroyEntity(ent);
  }

  public wallHit(ent: EntityState, _: Tile) {
    ent.game.destroyEntity(ent);
  }

  public playerHit(ent: EntityState, player: PlayerState) {
    ent.game.damage(player, 0.3, player);
    if (!player.invulnerable) player.v = player.v.add(this.v.normalize().scale(this.knockback));
    ent.game.destroyEntity(ent);
  }

  public move(_: EntityState, dt: number) {
    this.pos = this.v.scale(dt).add(this.pos);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.firedBy.color;
    fillArea(ctx, Box.square(this.pos, this.radius));
  }

  public tick(ent: EntityState, dt: number) {
    if (!playArea(ent.game.cfg).contains(this.pos)) return this.diverge(ent);
    const tile = ent.game.cfg.board.getTile(this.pos);
    if (tile !== undefined) return this.wallHit(ent, tile);
    const collider = Box.square(this.pos, this.radius);
    for (const [_, target] of ent.game.players) {
      if (target.cfg === this.firedBy) continue;
      if (playerBox(target).overlaps(collider)) return this.playerHit(ent, target);
    }
    this.move(ent, dt);
  }
}
