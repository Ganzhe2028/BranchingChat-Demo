const ANIMATION_DELAY_MS = 350;

export const alignNodeToViewport = (nodeId: string): void => {
  setTimeout(() => {
    const el = document.getElementById(`msg-node-${nodeId}`);
    if (!el) return;

    // Use scrollIntoView — works for any scroll container (not just window)
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, ANIMATION_DELAY_MS);
};
