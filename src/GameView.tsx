import React from "react";
import "./Game.scss";
import { Game, GameCfg } from "./game";
import { produce } from "immer";

interface GameProps {
  cfg: GameCfg,
  onExit: (winner: string|undefined) => void
}

export function GameView({ cfg, onExit }: GameProps): React.ReactElement {
  console.log("Rendering gameview")
  const onExitRef = React.useRef(onExit);
  onExitRef.current = onExit;
  const game = React.useMemo(() => new Game(produce(cfg, cfg => {
    cfg.entities.push({
      tick(entity, _dt) {
        if (entity.game.players.count() <= 1 && game.stop) {
          const players = [...entity.game.players];
          game.stop();
          onExitRef.current(players[0]?.[1].cfg.colour);
        }
      },
    })
  })), []);
  return <canvas className="game-canvas" ref={canvas => {
    console.log("Canvas changed");
    if (!canvas) return game.stop?.();
    game.playOn(canvas);
  }} />
}