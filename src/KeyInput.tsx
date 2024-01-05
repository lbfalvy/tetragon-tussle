import { classList } from "@lbfalvy/react-utils";
import React from "react";
import "./KeyInput.scss";

interface KeyInputProps {
  onChange: (key: string) => void,
  value: string,
}

export function KeyInput({ onChange, value }: KeyInputProps): React.ReactElement {
  const [cancel, setCancel] = React.useState<() => void>();
  return <button
    className={classList("KeyInput", cancel !== undefined && "listening")}
    onClick={() => {
      function listener(ev: KeyboardEvent) {
        if (ev.key !== "Escape") onChange(ev.key);
        setCancel(undefined);
      }
      if (cancel === undefined) {
        console.log("Updating from", value);
        window.addEventListener("keypress", listener);
        setCancel(() => () => window.removeEventListener("keypress", listener));
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