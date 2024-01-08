import React from "react";
import { Init } from "./Init";
import { GameCfg } from "./Game";
import { GameView } from "./GameView";
import { GameOver } from "./GameOver";

export function Navigator(): React.ReactElement {
  
  const [cfg, setCfg] = React.useState<GameCfg>();
  const [winner, setWinner] = React.useState<string>();
  if (cfg === undefined) return <Init onSubmit={setCfg} />
  if (winner === undefined) return <GameView cfg={cfg}
    onExit={(winner) => setWinner(winner ?? "")}
  />
  else return <GameOver winner={winner}
    onRematch={() => setWinner(undefined)}
    onMenu={() => {
      setCfg(undefined);
      setWinner(undefined);
    }}
  />
}