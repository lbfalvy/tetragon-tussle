import React from "react";
import "./GameOver.scss";

interface GameOverProps {
  winner: string,
  onRematch: () => void,
  onMenu: () => void,
}

export function GameOver({ winner, onMenu, onRematch }: GameOverProps): React.ReactElement {
  return <div className="GameOver" style={{ "--winner": winner } as React.CSSProperties}>
    <div className="center">
      <h1>Game Over</h1>
      <button onClick={onRematch} autoFocus>Rematch</button>
      <button onClick={onMenu}>Menu</button>
    </div>
  </div>
}