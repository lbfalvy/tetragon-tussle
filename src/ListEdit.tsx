import { castDraft, produce } from "immer";

/** An array that assigns unique IDs to elements to avoid index drift */
export class KeyList<T> {
  private constructor(
    readonly next_id: bigint,
    readonly items: readonly (readonly [bigint, T])[]
  ) {}

  public static new<T>(items: T[]): KeyList<T> {
    return new KeyList(BigInt(items.length), items.map((t, i) => [BigInt(i), t]));
  }

  public values(): T[] {
    return this.items.map(([_, t]) => t);
  }

  public set(i: number, value: T): KeyList<T> {
    const items = produce(this.items, l => {l.splice(i, 1, [this.items[i][0], castDraft(value)])});
    return new KeyList(this.next_id, items);
  }

  public get(i: number): T {
    return this.items[i][1];
  }

  public length(): number {
    return this.items.length;
  }

  public insert(i: number, value: T): KeyList<T> {
    const items = produce(this.items, l => {l.splice(i, 0, [this.next_id, castDraft(value)])});
    return new KeyList(this.next_id+1n, items);
  }

  public remove(i: number): KeyList<T> {
    return new KeyList(this.next_id, produce(this.items, l => {l.splice(i, 1)}));
  }

  public push(value: T): KeyList<T> {
    return this.insert(this.length(), value);
  }

  public entries(): readonly (readonly [bigint, T])[] {
    return this.items;
  }
}

interface ListEditProps<T> {
  value: KeyList<T>,
  onChange: (list: KeyList<T>) => void,
  Row: React.ComponentType<{ value: T, onChange: (value: T | undefined) => void }>
}

export function ListEdit<T>({ value, onChange, Row }: ListEditProps<T>): React.ReactElement {
  return <>
    {value.items.map(([id, t], i) => <Row key={id} value={t} onChange={val => {
      onChange(val === undefined ? value.remove(i) : value.set(i, val));
    }} />)}
  </>
}