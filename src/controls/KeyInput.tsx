import { classList } from "@lbfalvy/react-utils";
import React from "react";
import "./KeyInput.scss";

interface KeyInputProps {
  onChange: (key: string) => void,
  value: string,
}

export function KeyInput({ onChange, value }: KeyInputProps): React.ReactElement {
  const [cancel, setCancel] = React.useState<() => void>();
  function handler(ev: KeyboardEvent) {
    if (ev.key !== "Escape") onChange(ev.key);
    cancel?.();
    setCancel(undefined);
  }
  const listenerRef = React.useRef(handler);
  listenerRef.current = handler;
  return <button
    className={classList("KeyInput", cancel !== undefined && "listening")}
    onClick={() => {
      if (cancel === undefined) {
        console.log("Updating from", value);
        const listener = (ev: KeyboardEvent) => { listenerRef.current(ev) }
        window.addEventListener("keydown", listener);
        setCancel(() => () => window.removeEventListener("keydown", listener));
      } else {
        console.log("Cancelling key update")
        cancel();
        setCancel(undefined);
      }
    }}
  >
    {cancel === undefined ? value : "Press any key"}
  </button>
}