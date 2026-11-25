import { Img } from '@/components/ui/Img';

/**
 * Icon-only tech item: a 44px quiet frame square. The monogram sits under the icon, so a missing or failed icon
 * (hidden on error, no state) leaves it showing. The name is the accessible name and a CSS-only tooltip on hover and
 * keyboard focus (below the square). The frame keeps pale and dark monochrome icons legible in both themes.
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
      {iconUrl ? (
        <Img
          src={iconUrl}
          alt=""
          width={28}
          height={28}
          onError={(e) => (e.currentTarget.hidden = true)}
          className="tech-icon-img"
        />
      ) : null}
    </span>
  );
}
