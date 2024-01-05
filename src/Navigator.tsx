import React from "react";
import { Init } from "./Init";
import { GameCfg } from "./game";
import { GameView } from "./GameView";

export function Navigator(): React.ReactElement {
  const [cfg, setCfg] = React.useState<GameCfg>();
  if (cfg === undefined) return <Init onSubmit={setCfg} />
  else return <GameView cfg={cfg} onExit={() => setCfg(undefined)}/>
}