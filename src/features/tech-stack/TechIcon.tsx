import { Img } from '@/components/ui/Img';

/**
 * Icon-only tech item: a 44px quiet frame square. The monogram sits under the icon, so a missing or failed icon
 * (hidden on error, no state) leaves it showing. The name is the accessible name and a CSS-only tooltip on hover and
 * keyboard focus (below the square). Icons render monochrome in the tile ink (black on light, white on dark) so any upload reads in both themes.
 */
export function TechIcon({ name, iconUrl }: { name: string; iconUrl: string | null }) {
  return (
    <span
      // ponytail: focusable so the CSS tooltip shows on keyboard focus; a name-only stop, not a control.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="img"
      aria-label={name}
      className="tech-icon"
    >
      {name.slice(0, 2).toUpperCase()}
      <Img
        // No uploaded icon: the Simple Icons CDN by name (as the old TechBadge did); a miss leaves the monogram.
        src={iconUrl ?? `https://cdn.simpleicons.org/${name.toLowerCase().replace(/\s+/g, '')}`}
        alt=""
        width={28}
        height={28}
        onError={(e) => (e.currentTarget.hidden = true)}
        // A prerendered icon can fail before hydration, when onError is not attached yet: it is complete with no pixels.
        ref={(el: HTMLImageElement | null) => {
          // naturalWidth alone misreads a good SVG without intrinsic size (0 in Firefox); decode() rejects only when broken.
          if (el?.complete && !el.naturalWidth) el.decode().catch(() => (el.hidden = true));
        }}
        className="tech-icon-img"
      />
    </span>
  );
}
