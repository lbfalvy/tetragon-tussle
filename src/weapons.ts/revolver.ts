import { Game, PLAYER_RADIUS, PlayerState, fillArea, kill, playArea, playerBox } from "../game";
import { getKey } from "../keystates";
import { Box } from "../util/box";

export function makeRevolver(game: Game, player: PlayerState, trigger: string): () => void {
  const BULLET_V = 0.04;
  const BULLET_RADIUS = 0.1;
  const RELOAD_TIME = 1000;
  const SHOT_SPACING = 300;
  const KNOCKBACK = 0.005;
  let clip = 6;
  let time_since_last_shot = 0;
  const revolver = game.createEntity({
    tick(_, dt) {
      time_since_last_shot += dt;
      if (clip === 0 || !getKey(trigger) || time_since_last_shot <= SHOT_SPACING) return;
      // shoot
      time_since_last_shot = 0;
      if (--clip === 0) setTimeout(() => clip = 6, RELOAD_TIME);
      const hdg = player.cfg.moveset.getHdgInput();
      const v = hdg.normalize().scale(BULLET_V);
      player.v = player.v.add(hdg.normalize().scale(-KNOCKBACK));
      let pos = hdg.scale(BULLET_RADIUS + PLAYER_RADIUS + 0.1).add(player.pos);
      game.createEntity({
        draw(_entity, ctx) {
          ctx.fillStyle = "yellow"
          fillArea(ctx, Box.square(pos, BULLET_RADIUS));
        },
        tick(entity, dt) {
          pos = v.scale(dt).add(pos);
          if (!playArea(game.cfg).contains(pos) || game.cfg.board.getTile(pos) === "wall") {
            game.entities.delete(entity.id);
          }
          for (const [_, target] of game.players) {
            if (!playerBox(target).overlap(Box.square(pos, BULLET_RADIUS)).isEmpty()) {
              kill(target);
              game.entities.delete(entity.id);
            }
          }
        },
      })
    }
  })
  return () => game.entities.delete(revolver.id);
}