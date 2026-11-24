import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  Disclosure,
  DisclosureGroup,
  FeatureColumns,
  LinkChevron,
  LinkedGroupRow,
  MediaFrame,
  PillButton,
  SegmentedControl,
  SpecRow,
  Tile,
  TileHeading,
} from '@/components/tile';
import { useT } from '@/i18n';
import { FlipGroup } from './FlipGroup';
import { Marquee } from './Marquee';
import { morphName } from './Morph';
import { RouteFade } from './RouteFade';
import { ScrollFill } from './ScrollFill';

/**
 * Dev-only motion preview (`/__motion`, `/__motion/detail`): every engine of the motion layer on one page, for review
 * and the motion e2e spec. Not linked, not prerendered, not in the sitemap; the route is only registered in dev and
 * e2e builds (`VITE_MOTION_PREVIEW=1`). Outside the public layout, so it carries its own RouteFade.
 * Headings and items are harness placeholders (dev only, never shipped); control labels come from `t()`.
 */
const POSTER = { src: '/models/card-poster.webp', width: 476, height: 720 };
const BAND = { src: '/models/band.webp', width: 1024, height: 248 };
const BASE = '/__motion';

const items = ['alpha', 'beta', 'gamma', 'delta'].map((id, i) => ({
  id,
  title: `Item ${id}`,
  line: `Linked group ${i + 1}: hover zooms the photo and lights it.`,
  href: `${BASE}/detail`,
  image: i % 2 === 0 ? { ...POSTER, alt: '' } : null,
  morph: id === 'alpha' ? morphName('preview', 'alpha') : undefined,
}));

const names = [
  'TypeScript',
  'React',
  'Vite',
  'Supabase',
  'Tailwind',
  'GSAP',
  'Lenis',
  'Playwright',
];

type Filter = 'all' | 'even' | 'odd';
const flipItems = Array.from({ length: 9 }, (_, i) => i + 1);

function Main() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = flipItems.filter((n) =>
    filter === 'all' ? true : filter === 'even' ? n % 2 === 0 : n % 2 === 1,
  );
  return (
    <>
      <Tile labelledBy="mp-hero" size="hero" enter glow>
        <h1 id="mp-hero" className="max-w-[14ch] animate-rise-still text-hero text-tile-ink">
          Motion preview
        </h1>
        <div className="flex animate-rise flex-col items-center [animation-delay:120ms]">
          <p className="mt-5 max-w-[34ch] text-lead text-tile-ink">
            Every engine of the motion layer, in page order.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <PillButton href="#mp-specs">Press me</PillButton>
            <LinkChevron href="#mp-rows">Nudge me</LinkChevron>
          </div>
        </div>
        <MediaFrame
          {...BAND}
          alt=""
          aspect="fill"
          priority
          settle
          className="mt-stack animate-rise-still [animation-delay:150ms]"
        />
      </Tile>

      <Tile id="mp-specs" labelledBy="mp-specs-h" tone="parchment">
        <TileHeading id="mp-specs-h" title="Words rise into place as you arrive" />
        <SpecRow
          className="mt-stack"
          items={[
            { value: 42, label: 'Counts up once' },
            { value: 7.5, label: 'Keeps its decimals' },
            { value: 'Text', label: 'Prints as is' },
          ]}
        />
      </Tile>

      <Tile id="mp-rows" labelledBy="mp-rows-h">
        <TileHeading id="mp-rows-h" title="Rows rise in, one column after another" />
        <FeatureColumns
          className="mt-stack"
          items={[1, 2, 3].map((n) => ({
            key: String(n),
            title: `Column ${n}`,
            body: 'Translate only, never a fade, scrubbed by scroll.',
          }))}
        />
        <div className="mt-stack w-full">
          <LinkedGroupRow items={items} moreLabel={t.motion.previewOpen} />
        </div>
      </Tile>

      <Tile labelledBy="mp-photo-h" tone="dark">
        <TileHeading id="mp-photo-h" title="A standalone photo drifts with the page" />
        <MediaFrame {...BAND} alt="" aspect="wide" parallax={8} className="mt-stack" />
      </Tile>

      <Tile labelledBy="mp-reveal-h">
        <TileHeading id="mp-reveal-h" title="A frame opens once when it enters" />
        <MediaFrame {...POSTER} alt="" aspect="landscape" reveal className="mt-stack" />
      </Tile>

      <Tile labelledBy="mp-fill-h" tone="parchment">
        <h2 id="mp-fill-h" className="sr-only">
          Scroll fill
        </h2>
        <ScrollFill
          className="max-w-[24ch] text-tile text-tile-ink"
          text="One statement per page fills with ink, word by word, as it crosses the screen."
        />
      </Tile>

      <Tile labelledBy="mp-names-h">
        <TileHeading id="mp-names-h" title="Names drift sideways" />
        <div className="mt-stack w-full">
          <Marquee
            items={names}
            label={t.motion.previewTools}
            pauseLabel={t.motion.pauseList}
            playLabel={t.motion.playList}
            itemClassName="text-title text-tile-muted"
          />
        </div>
      </Tile>

      <Tile labelledBy="mp-faq-h" tone="parchment">
        <TileHeading id="mp-faq-h" title="Rows open and close" />
        <DisclosureGroup className="mt-stack w-full max-w-[44rem] text-left">
          {['first', 'second', 'third'].map((k) => (
            <Disclosure
              key={k}
              id={`mp-${k}`}
              summary={<span className="text-title">Row {k}</span>}
            >
              <p className="pb-5 text-body text-tile-muted">
                The height animates both ways and the content fades.
              </p>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </Tile>

      <Tile labelledBy="mp-flip-h">
        <TileHeading id="mp-flip-h" title="Filtered lists glide to their new places" />
        <SegmentedControl<Filter>
          className="mt-stack"
          label={t.motion.previewFilter}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'even', label: 'Even' },
            { value: 'odd', label: 'Odd' },
          ]}
        />
        <FlipGroup
          flipKey={filter}
          data-testid="mp-flip"
          className="mt-stack grid w-full grid-cols-3 gap-4"
        >
          {shown.map((n) => (
            <li
              key={n}
              data-flip-id={n}
              className="flex aspect-[4/3] items-center justify-center rounded-lg bg-tile-frame text-title text-tile-ink"
            >
              {n}
            </li>
          ))}
        </FlipGroup>
      </Tile>
    </>
  );
}

function Detail() {
  return (
    <Tile labelledBy="mp-detail" size="hero">
      <h1 id="mp-detail" className="max-w-[14ch] text-hero text-tile-ink">
        Item alpha
      </h1>
      <p className="mt-5 text-lead text-tile-ink">
        <Link to={BASE} className="text-tile-action hover:underline">
          Back to the preview
        </Link>
      </p>
      <MediaFrame
        {...POSTER}
        alt=""
        aspect="wide"
        priority
        morph={morphName('preview', 'alpha')}
        className="mt-stack"
      />
    </Tile>
  );
}

export default function MotionPreview() {
  const { pathname } = useLocation();
  return (
    <main data-motion-preview="">
      <RouteFade>{pathname.endsWith('/detail') ? <Detail /> : <Main />}</RouteFade>
    </main>
  );
}
