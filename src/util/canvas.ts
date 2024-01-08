import { Box } from "./box";

export function fillArea(ctx: CanvasRenderingContext2D, b: Box) {
  ctx.fillRect(b.minX(), b.minY(), b.sizeX(), b.sizeY());
}

export function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Could not obtain drawing context");
  return ctx;
}

export function withCtx(canvas: HTMLCanvasElement, f: (c: CanvasRenderingContext2D) => void): () => undefined {
  const observer = new ResizeObserver(() => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    f(getCtx(canvas));
  });
  observer.observe(canvas);
  f(getCtx(canvas));
  return () => { observer.disconnect() };
}