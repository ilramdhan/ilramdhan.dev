import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useSplitReveal } from '@/components/motion/useSplitReveal';
import { useLocalePath, useT } from '@/i18n';

/** D12 photographs (public/images/backgrounds, credits in docs/redesign/photo-credits.md), 16:9 at 1280 and 2560. */
export type CtaPhoto = 'desk' | 'code' | 'light';

/**
 * D13: the one closing "Get in touch" tile → /contact on every public page but /contact, legal, 404 and admin. A dark
 * tile (never the footer's parchment, F-9) with one full-bleed D12 photograph under the copy: decorative (empty alt,
 * aria-hidden), lazy, dimmed over the night ground (`.cta-photo` opacity is the scrim) so the white heading and the
 * pill keep AA in both themes. The photo drifts on the CSS scroll timeline (transform only, still under reduced
 * motion; no JS). Classes live in global.css (`.cta*`).
 * ponytail: Tile/TileHeading/PillButton markup written out (same look) so /blog's first load
 * stays in budget; switch to the partials when the budget has room.
 */
export function ContactCta({
  id,
  photo,
  title,
  lead,
  action,
  secondary,
}: {
  /** Anchor id (home: `contact`). */
  id?: string;
  photo: CtaPhoto;
  title?: string;
  lead?: string;
  /** Pill label (default: "Send a message"). */
  action?: string;
  /** Optional second link (LinkChevron) after the pill. */
  secondary?: ReactNode;
}) {
  const t = useT();
  const lp = useLocalePath();
  const heading = title ?? t.home.contactTitle;
  const ref = useRef<HTMLHeadingElement>(null);
  useSplitReveal(ref, true, heading);
  const hid = `${id ?? 'cta'}-h`;
  const src = `/images/backgrounds/${photo}-`;
  const set = (ext: string) => `${src}1280.${ext} 1280w, ${src}2560.${ext} 2560w`;
  return (
    <section id={id} aria-labelledby={hid} data-tone="dark" data-cta={photo} className="cta">
      <div aria-hidden="true" className="cta-photo">
        <picture>
          <source type="image/avif" srcSet={set('avif')} sizes="100vw" />
          <img
            src={`${src}1280.webp`}
            srcSet={set('webp')}
            sizes="100vw"
            width={2560}
            height={1440}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div className="wrap flex flex-col items-center text-center">
        <h2 ref={ref} id={hid} data-reveal="" className="text-tile max-w-[20ch]">
          {heading}
        </h2>
        <p className="mt-5 max-w-[34ch] text-lead">{lead ?? t.home.contactLead}</p>
        <div className="cta-links">
          <Link to={lp('/contact')} className="cta-pill">
            {action ?? t.contact.formTitle}
          </Link>
          {secondary}
        </div>
      </div>
    </section>
  );
}
