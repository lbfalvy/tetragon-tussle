/**
 * A thin wrapper around [requestAnimationFrame] to automatically request the next frame
 * when the current one is rendered
 */
export function startAnimation(callback: FrameRequestCallback): () => void {
  let exiting = false;
  function loop(timestamp: DOMHighResTimeStamp) {
    if (exiting) return;
    callback(timestamp);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return () => exiting = true;
}