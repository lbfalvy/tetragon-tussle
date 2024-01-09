import { Weapon, WeaponClass } from ".";
import { PLAYER_RADIUS, PlayerState } from "../Game";
import { Box } from "../util/box";

export class Shield implements Weapon {
  public readonly class: WeaponClass = Shield;
  public static readonly id = "Shield";
  
  private raised = false;
  private cooling_down = false;

  constructor(
    public readonly player: PlayerState,
    public readonly trigger: string,
    public readonly up_time = 500,
    public readonly cooldown = 1500,
    public readonly radius = 1.2,
  ) {}

  public static instantiate(player: PlayerState, trigger: string): Weapon {
    return new this(player, trigger);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (!this.raised) return;
    ctx.fillStyle = this.player.cfg.color_light;
    const area = new Path2D();
    area.rect(...Box.square(this.player.pos, PLAYER_RADIUS * this.radius).xywh());
    area.rect(...Box.square(this.player.pos, PLAYER_RADIUS).xywh());
    ctx.fill(area, "evenodd");
  }

  public tick() {
    if (!this.raised && !this.cooling_down) {
      if (!this.player.cfg.moveset.switch(this.trigger).get()) return;
      this.raised = true;
      this.player.invulnerable = true;
      setTimeout(() => {
        this.player.invulnerable = false;
        this.raised = false;
        this.cooling_down = true;
      }, this.up_time);
      setTimeout(() => {
        this.cooling_down = false
      }, this.up_time + this.cooldown);
    }
  }
}