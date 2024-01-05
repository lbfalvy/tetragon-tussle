import { Vec2,  } from "./vec2";

/// Cut a vector into equal parts not larger than step
export function* increments(v: Vec2, step: number, max: number): Generator<Vec2, void> {
  const step_v = v.normalize().scale(step);
  const leftover = v.normalize().scale(v.length() % step);
  const steps = Math.floor(v.length() / step);
  for (let i = 0; i < Math.min(steps, max); i++) {
    yield step_v;
  }
  yield leftover;
}