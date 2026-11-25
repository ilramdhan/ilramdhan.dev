/**
 * Circle reveal (F-13): starts a View Transition that commits `apply` (synchronous: flushSync) and grows the new theme
 * as a circle from `from`'s centre, a Web Animation on this transition's `::view-transition-new(root)` only, so route
 * fades are never touched, and nothing inline for the CSP. Lazy (ThemeControls): not in the entry chunk.
 */
export function reveal(apply: () => void, from: Element) {
  const r = from.getBoundingClientRect();
  const at = `at ${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
  void document.startViewTransition(apply).ready.then(() =>
    document.documentElement.animate(
      // 150vmax reaches the farthest corner from any point on screen.
      { clipPath: [`circle(0 ${at})`, `circle(150vmax ${at})`] },
      {
        duration: 560,
        easing: 'cubic-bezier(.22,1,.36,1)',
        pseudoElement: '::view-transition-new(root)',
      },
    ),
  );
}
