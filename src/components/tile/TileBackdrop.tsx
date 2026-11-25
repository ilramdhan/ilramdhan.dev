export type BackdropShape = 'rings' | 'dots' | 'waves';

/**
 * D7 / F-8: one quiet abstract shape in a tile corner (opacity <= 0.12, aria-hidden). Static markup (CLS 0); the mask
 * over currentColor lives in global.css (`[data-backdrop]`), so it follows light/dark. The first child drifts on a
 * CSS scroll-driven animation (`backdrop-drift`, transform only, off under reduced motion; no JS).
 * The parent tile must be `relative isolate`; the shape sits behind the content (-z-10) in a corner, never over text.
 */
export function TileBackdrop({
  shape,
  side = 'right',
}: {
  shape: BackdropShape;
  side?: 'left' | 'right';
}) {
  return (
    <div aria-hidden="true" data-backdrop={shape} data-backdrop-side={side}>
      <div />
    </div>
  );
}
