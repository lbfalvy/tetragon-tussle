import React from "react";
import { Init } from "./Init";
import { GameCfg } from "./game";
import { Game } from "./Game";

export function Navigator(): React.ReactElement {
  const [cfg, setCfg] = React.useState<GameCfg>();
  if (cfg === undefined) return <Init onSubmit={setCfg} />
  else return <Game cfg={cfg} onExit={() => setCfg(undefined)}/>
}