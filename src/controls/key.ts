import { Emit, Variable, variable } from "@lbfalvy/mini-events";

const KEYVARS = new Map<string, [Emit<[boolean]>, Variable<boolean>]>();

function record(key: string, value: boolean) {
  const v = KEYVARS.get(key);
  if (v) v[0](value);
  else KEYVARS.set(key, variable(value));
}

window.addEventListener("keydown", ev => record(ev.key, true));
window.addEventListener("keyup", ev => record(ev.key, false));

export function key(key: string): Variable<boolean> {
  const v = KEYVARS.get(key);
  if (v) return v[1];
  const val = variable(false);
  KEYVARS.set(key, val);
  return val[1];
}