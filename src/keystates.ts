const KEYSTATES = new Map<string, boolean>();

window.addEventListener("keydown", ev => KEYSTATES.set(ev.key, true));
window.addEventListener("keyup", ev => KEYSTATES.set(ev.key, false));

export function getKey(key: string): boolean {
  return KEYSTATES.get(key) ?? false;
}