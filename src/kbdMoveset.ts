import { MoveSet } from "./game";
import { getKey } from "./keystates";
import { Vec2 } from "./util/vec2";

export function kbdMoveset(up: string, down: string, left: string, right: string): MoveSet {
  let lastNonZero = new Vec2(1, 0);
  function move(): Vec2 {
    const move = new Vec2(
      (getKey(left) ? -1 : 0) + (getKey(right) ? 1 : 0),
      (getKey(up) ? -1 : 0) + (getKey(down) ? 1 : 0),
    );
    if (!move.isZero()) lastNonZero = move;
    return move;
  }
  return {
    getMoveInput: move,
    getHdgInput: () => {
      move();
      return lastNonZero;
    }
  }
}