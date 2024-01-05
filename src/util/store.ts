/** Iterable sequentially keyed store
 * 
 * This store can be modified while iterating. Internally, it uses temporary repositories to record
 * changes to the main map while any iterators exist. Once all iterators are disposed, the changes
 * are applied to the main repository.
 * 
 * late-add/early-remove. Iterators only visit elements that have been added to the main repo, but
 * skip over elements that have been removed.
 */
export type Store<T> = Iterable<[bigint, T]> & {
  get(id: bigint): T | undefined;
  add(value: T): bigint;
  create(f: (id: bigint) => T): T;
  delete(id: bigint): T | undefined;
  count(): number;
}

interface Entry<T> { value: T, removed: boolean }

export function store<T>(): Store<T> {
  const entries = new Map<bigint, Entry<T>>();
  let pending_delete = new Set<bigint>();
  let pending_insert = new Map<bigint, T>();
  let iterating = 0;
  let next_id = BigInt(0);
  function tf_iter_result(res: IteratorResult<[bigint, Entry<T>]>): IteratorResult<[bigint, T]> {
    if (res.done ?? false) return { done: true, value: undefined };
    return { done: false, value: [res.value[0], res.value[1].value] };
  }
  return {
    get: (id) => {
      const ent = entries.get(id);
      if (ent && ent.removed) return undefined;
      if (ent) return ent.value;
      else return pending_insert.get(id);
    },
    add(value) {
      const id = next_id++;
      if (iterating === 0) entries.set(id, { removed: false, value });
      else pending_insert.set(id, value);
      return id;
    },
    create(f) {
      const id = next_id++;
      const value = f(id);
      if (iterating === 0) entries.set(id, { removed: false, value });
      else pending_insert.set(id, value);
      return value;
    },
    delete(id) {
      const ent = entries.get(id);
      if (!ent || ent.removed) return undefined;
      if (iterating === 0) {
        entries.delete(id);
      } else {
        ent.removed = true;
        pending_delete.add(id);
      }
      return ent.value;
    },
    count() {
      return entries.size - pending_delete.size + pending_insert.size;
    },
    [Symbol.iterator]: () => {
      let done = false;
      iterating++;
      const nested = entries[Symbol.iterator]();
      function finalize() {
        if (done) return;
        done = true;
        iterating--;
        if (iterating === 0) {
          for (const id of pending_delete) entries.delete(id);
          for (const [id, value] of pending_insert) entries.set(id, { removed: false, value });
          pending_delete = new Set();
          pending_insert = new Map();
        }
      }
      const next: Iterator<[bigint, T]>["next"] = () => {
        if (done) return { done: true, value: undefined };
        const res = nested.next();
        const value = res.value as [bigint, Entry<T>] | undefined;
        if (res.done ?? false) finalize();
        if (value?.[1].removed ?? false) return next();
        return tf_iter_result(res);
      };
      return {
        next,
        return(value) {
          finalize();
          if (!nested.return) return { done: true, value: undefined };
          return tf_iter_result(nested.return(value));
        },
        throw(e) {
          finalize();
          if (!nested.throw) return { done: true, value: undefined };
          return tf_iter_result(nested.throw(e));
        },
      }
    }
  }
}