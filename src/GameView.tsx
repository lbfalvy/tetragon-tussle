import React from "react";
import "./GameView.scss";
import { Game, GameCfg, PlayerCfg } from "./Game";
import { classList, useVariable } from "@lbfalvy/react-utils";
import { select, variable } from "@lbfalvy/mini-events";

interface GameProps {
  cfg: GameCfg,
  onExit: (winner: string|undefined) => void
}

export function GameView({ cfg, onExit }: GameProps): React.ReactElement {
  console.log("Rendering gameview");
  const onExitRef = React.useRef(onExit);
  onExitRef.current = onExit;
  const scoresRef = React.useRef(variable(cfg.players.map(p => [p, 0] as [PlayerCfg, number])))
  const game = React.useMemo(() => {
    const game = new Game(cfg);
    game.death((player, killer) => {
      const [setScores, scoreVar] = scoresRef.current;
      const scores = scoreVar.get();
      if (killer !== undefined) {
        setScores(scores.map(x => x[0] === killer.cfg ? [x[0], x[1] + 1] : x))
        if (scores.find(e => e[0] === killer.cfg)![1] === 9) onExit(killer.cfg.color);
        else game.spawn(player.cfg);
      } else {
        setScores(scores.map(x => x[0] === player.cfg ? [x[0], Math.max(x[1] - 1, 0)] : x));
        game.spawn(player.cfg);
      }
    })
    return game;
  }, []);
  const scores = useVariable(scoresRef.current[1]);
  const free_axis = useVariable(select(game.underscanAxis, ([axis, _amount]) => axis));
  return <div className="GameView">
    <canvas ref={canvas => {
      console.log("Canvas changed");
      if (!canvas) return game.stop?.();
      game.playOn(canvas);
    }} />
    <div className={classList("overlay", `overlay-${free_axis}`)}>
      {scores.map(([{ color }, score]) => <div key={color} style={{ color }}>{score}</div>)}
    </div>
  </div>
}