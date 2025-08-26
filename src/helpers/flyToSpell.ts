// helpers/flyToSpell.ts
export function flyTileToSpell(tileId: string, targetSpellIndex: number) {
  const source = document.querySelector<HTMLElement>(
    `[data-tile-id="${tileId}"]`,
  );
  const target = document.querySelector<HTMLElement>(
    `[data-spell-index="${targetSpellIndex}"]`,
  );

  if (!source || !target) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const clone = source.cloneNode(true) as HTMLElement;

  // Prevent any existing CSS animations (e.g., Tailwind animate-in) on the clone.
  // 1) Remove Tailwind animate-* and motion-safe:animate-* classes
  Array.from(clone.classList).forEach((cls) => {
    if (/^(motion-(safe|reduce):)?animate-/.test(cls)) {
      clone.classList.remove(cls);
    }
  });
  // 2) Force-disable CSS animations in case inline or keyframes remain
  clone.style.animation = "none";
  // 3) If the Web Animations API is used anywhere, cancel them on the clone
  try {
    clone.getAnimations?.().forEach((a: Animation) => a.cancel());
  } catch {
    // no-op
  }

  Object.assign(clone.style, {
    position: "fixed",
    margin: "0",
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    zIndex: "9999",
    pointerEvents: "none",
    transition: "transform 500ms ease, opacity 500ms ease",
    willChange: "transform, opacity",
  });

  document.body.appendChild(clone);

  const sourceCenter = {
    x: sourceRect.left + sourceRect.width / 2,
    y: sourceRect.top + sourceRect.height / 2,
  };
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // force layout
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  clone.offsetHeight;

  clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
  clone.style.opacity = "0.4";

  const cleanup = () => {
    clone.remove();
  };

  clone.addEventListener("transitionend", cleanup, { once: true });
}
