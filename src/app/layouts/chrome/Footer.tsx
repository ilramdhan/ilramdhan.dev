import { useEffect, useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Disclosure, DisclosureGroup } from '@/components/tile';
import { motionOk } from '@/components/motion/near';
import { profileQueries } from '@/features/profile/queries';
import { socialEntries } from '@/lib/social';
import { Link } from '@/i18n/Link';
import { useT } from '@/i18n';
import { APP_COMMIT, releaseUrl, versionLabel } from '@/lib/version';
import { BRAND_NAME, type NavItem } from './nav-items';
import { BrandMark } from './Brand';
import { LocaleSwitcher } from './controls';

const fineLink =
  'inline-flex min-h-11 items-center text-ink/80 decoration-1 underline-offset-[3px] hover:text-ink hover:underline';

/**
 * The footer wordmark rises while the curtain lifts (engine lazy, near the viewport). Off below 834px, on short
 * screens, under reduced motion and when the stage fell back to a static footer: the wordmark rests in place.
 */
function WordmarkRise({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOk() || typeof IntersectionObserver === 'undefined') return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    // Armed when the page's end is within a screen and a half: the footer trigger needs the full page height.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import('@/components/motion/wordmark-rise-engine')
          .then(({ attachWordmarkRise }) => {
            if (!cancelled) cleanup = attachWordmarkRise(el);
          })
          .catch(() => {
            /* resting wordmark */
          });
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      cleanup?.();
    };
  }, []);
  return (
    <div ref={ref} className="will-change-transform" data-wordmark-rise="">
      {children}
    </div>
  );
}

/** The name set edge to edge in a fixed viewBox (no font-metric shift: CLS 0). Decorative. */
function Wordmark() {
  return (
    <svg
      viewBox="0 0 1400 170"
      aria-hidden="true"
      focusable="false"
      className="footer-wordmark"
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x="0"
        y="148"
        textLength="1400"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        fontSize="196"
        fontWeight="600"
        letterSpacing="-6"
      >
        {BRAND_NAME}
      </text>
    </svg>
  );
}

/**
 * Parchment doormat (mutugading DoormatFooter, P12.2 Apple pattern): the mark and a 12px summary, link columns at
 * >= 834px (Disclosure rows below), then fine print: copyright, legal, socials as text links, version and language
 * names. Only real data: the profile's footer text and social links; anything missing is not rendered.
 */
export function Footer({ items }: { items: NavItem[] }) {
  const t = useT();
  const { data: profile } = useQuery(profileQueries.detail());
  const socials = socialEntries(profile?.social_links);
  const columns: Array<{ id: string; heading: string; links: ReactNode[] }> = [
    {
      id: 'pages',
      heading: t.footer.pages,
      links: [{ id: 'home', label: t.nav.home, href: '/' }, ...items].map((l) => (
        <Link key={l.id} to={l.href} className={fineLink}>
          {l.label}
        </Link>
      )),
    },
    ...(socials.length
      ? [
          {
            id: 'social',
            heading: t.footer.social,
            links: socials.map(([key, href]) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={fineLink}
              >
                {t.footer.socialName[key]}
              </a>
            )),
          },
        ]
      : []),
  ];

  return (
    <footer className="bg-parchment text-fine text-ink-muted">
      <div className="wrap pt-10 pb-6">
        <Link
          to="/"
          aria-label={t.nav.homeLink(BRAND_NAME)}
          className="-ml-1 inline-flex min-h-11 min-w-11 items-center rounded-xs px-1"
        >
          <BrandMark className="size-7" />
        </Link>
        {profile?.short_description ? (
          <p className="max-w-[72ch] pt-2 pb-4">{profile.short_description}</p>
        ) : null}

        <nav aria-label={t.footer.nav} className="pt-6 nav:border-t nav:border-rule max-nav:pt-0">
          <DisclosureGroup
            staticFrom="nav"
            className="nav:grid nav:grid-cols-4 nav:gap-x-8 nav:gap-y-8"
          >
            {columns.map((col) => (
              <Disclosure
                key={col.id}
                id={`footer-col-${col.id}`}
                heading="h2"
                bare
                summary={col.heading}
                className="max-nav:border-b max-nav:border-rule [&>h2]:text-fine [&>h2]:font-semibold [&>h2]:text-ink"
                triggerClassName="text-fine font-normal text-ink"
                iconClassName="text-ink-muted"
              >
                <ul className="pb-3 nav:mt-2.5 nav:pb-0">
                  {col.links.map((link, i) => (
                    <li key={i} className="max-nav:pl-2.5 nav:[&>a]:min-h-7">
                      {link}
                    </li>
                  ))}
                </ul>
              </Disclosure>
            ))}
          </DisclosureGroup>
        </nav>

        <div className="mt-6 flex flex-col gap-y-2 border-t border-rule pt-3 nav:mt-8 nav:flex-row nav:items-center nav:justify-between">
          {profile?.footer_text ? <p>{profile.footer_text}</p> : null}
          <div className="flex flex-wrap items-center gap-x-6">
            <ul aria-label={t.footer.legal} className="flex flex-wrap items-center">
              <li className="flex items-center">
                <Link to="/privacy" className={fineLink}>
                  {t.footer.privacy}
                </Link>
              </li>
              <li className="flex items-center">
                <span aria-hidden="true" className="mx-2.5 text-ink/30">
                  |
                </span>
                <Link to="/terms" className={fineLink}>
                  {t.footer.terms}
                </Link>
              </li>
              <li className="flex items-center">
                <span aria-hidden="true" className="mx-2.5 text-ink/30">
                  |
                </span>
                <a
                  href={releaseUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.footer.versionLabel(versionLabel(), APP_COMMIT)}
                  data-testid="app-version"
                  className={`${fineLink} tabular`}
                >
                  {versionLabel()}
                </a>
              </li>
            </ul>
            <LocaleSwitcher variant="names" className="gap-2" />
          </div>
        </div>
      </div>
      <div className="footer-wordmark-box" aria-hidden="true">
        <WordmarkRise>
          <Wordmark />
        </WordmarkRise>
      </div>
    </footer>
  );
}

/**
 * Footer reveal (mutugading RevealFooter + RevealGuard): the curtain (page content, z 2) scrolls away off a footer
 * that is `position: sticky; bottom: 0` (z 1) in the same stage, so it is uncovered already in place. No JS for the
 * reveal. The guard falls back to a static footer (`data-reveal="static"`) whenever the footer is taller than the
 * viewport; CSS keeps it static below 834px wide / 760px tall, under reduced motion and in print.
 */
export function RevealStage({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = ref.current;
    const foot = stage?.querySelector<HTMLElement>('[data-reveal-footer]');
    if (!stage || !foot) return;
    const check = () => {
      if (foot.offsetHeight > window.innerHeight - 8) stage.dataset.reveal = 'static';
      else delete stage.dataset.reveal;
    };
    check();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    ro?.observe(foot);
    window.addEventListener('resize', check);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="reveal-stage relative isolate flex flex-1 flex-col"
      data-reveal-stage=""
    >
      <div className="reveal-curtain flex flex-1 flex-col">{children}</div>
      <div className="reveal-footer bg-parchment" data-reveal-footer="">
        {footer}
      </div>
    </div>
  );
}
