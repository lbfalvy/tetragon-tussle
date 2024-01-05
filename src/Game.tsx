import React from "react";
import "./Game.scss";
import { GameCfg, startGame } from "./game";
import { produce } from "immer";

interface GameProps {
  cfg: GameCfg,
  onExit: (winner: string|undefined) => void
}

export function Game({ cfg, onExit }: GameProps): React.ReactElement {
  const cleanup = React.useRef<() => void>();
  return <canvas className="game-canvas" ref={canvas => {
    cleanup.current?.();
    const game_cfg = produce(cfg, cfg => {cfg.entities.push({
      tick(entity, _dt) {
        if (entity.game.players.count() <= 1) {
          const players = [...entity.game.players];
          onExit(players[0]?.[1].cfg.colour);
        }
      },
    })})
    if (canvas) cleanup.current = startGame(canvas, game_cfg);
  }} />
}