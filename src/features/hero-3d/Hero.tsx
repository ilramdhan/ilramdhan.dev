import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@/lib/hooks';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { profileQueries } from '@/features/profile/queries';

// three.js, Rapier and the model live in this chunk; it is only imported when
// `useHeroCard` allows it (T-25), so mobile and reduced-motion visitors never fetch it.
const HeroCard = lazy(() => import('./HeroCard'));

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Whether to mount the interactive 3D card: desktop layout (≥ 1024 px, where the hero
 * reserves room for it), motion allowed and WebGL available. Mounting waits for the
 * browser to be idle so the card never competes with the first paint.
 */
function useHeroCard(): { enabled: boolean; ready: boolean } {
  const desktop = useMediaQuery('(min-width: 1024px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [webgl] = useState(hasWebGL);
  const enabled = desktop && !reducedMotion && webgl;
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled || idle) return;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 200);
    return () => window.clearTimeout(id);
  }, [enabled, idle]);

  return { enabled, ready: enabled && idle };
}

const ROLE_INTERVAL_MS = 2800;

/**
 * Rotating role line. Every role is laid out invisibly in one grid cell, so the line is
 * always as wide/tall as the longest role and swapping never shifts anything (CLS).
 * Visual text is aria-hidden; assistive tech reads one static list. Under reduced
 * motion (or with a single role) the first role is shown and nothing rotates.
 */
function RotatingRole({ roles }: { roles: string[] }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [index, setIndex] = useState(0);
  const rotate = !reducedMotion && roles.length > 1;

  useEffect(() => {
    if (!rotate) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % roles.length), ROLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [rotate, roles.length]);

  return (
    <p
      data-testid="hero-roles"
      className="grid min-h-[1.75em] text-xl sm:text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4"
    >
      <span className="sr-only">{roles.join(', ')}</span>
      {roles.map((role) => (
        <span key={role} aria-hidden="true" className="invisible col-start-1 row-start-1">
          {role}
        </span>
      ))}
      <span
        key={rotate ? index : 0}
        aria-hidden="true"
        className="col-start-1 row-start-1 motion-safe:animate-page-in"
        data-testid="hero-role-current"
      >
        {roles[rotate ? index : 0] ?? '\u00A0'}
      </span>
    </p>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const card = useHeroCard();

  const { data: profile, isLoading } = useQuery(profileQueries.detail());

  const roles = profile?.hero_title
    ? profile.hero_title
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* 3D card layer: desktop only. It sits under the content layer, whose
          pointer-transparent spacer lets the card be grabbed and dragged. */}
      {card.ready && (
        <Suspense fallback={null}>
          <HeroCard />
        </Suspense>
      )}

      {/* Content Layer - Relative Z-10 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pointer-events-none">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content - Enable Pointer Events */}
          <motion.div
            className="flex-1 w-full text-center lg:text-left pointer-events-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLoading && (
              <span
                aria-hidden="true"
                className="block mx-auto lg:mx-0 h-[30px] w-40 rounded-full bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse mb-6"
              />
            )}
            {profile?.badge_text && (
              <span className="inline-flex align-top items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {profile.badge_text}
              </span>
            )}
            {/* The H1 is the owner's name: static, never typed, so it is stable for crawlers,
                screen readers and tests. A skeleton holds its place while the profile loads. */}
            <h1 className="font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 break-words text-[clamp(2.25rem,1.2rem+4.5vw,4.5rem)] leading-[1.1] min-h-[1.1em]">
              {profile?.display_name ?? (
                <span
                  aria-hidden="true"
                  className="inline-block h-[1em] w-3/4 align-middle rounded bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse"
                />
              )}
            </h1>
            <RotatingRole roles={roles} />
            <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-xl text-slate-600 dark:text-slate-400 mb-8 min-h-7">
              {isLoading ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-6 w-3/4 align-middle rounded bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse"
                />
              ) : (
                profile?.short_description
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                View Projects <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/#contact"
                className="w-full sm:w-auto px-8 py-3 text-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white font-semibold transition-all active:scale-[0.98]"
              >
                Contact Me
              </Link>
            </div>

            <SocialLinks
              links={profile?.social_links}
              containerClassName="mt-10 min-h-6 flex flex-wrap items-center justify-center lg:justify-start gap-6"
              linkClassName="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors"
              iconClassName="h-6 w-6"
            />
          </motion.div>

          {/* Room for the 3D card on desktop (the canvas renders behind this box).
              Without the interactive card (reduced motion / no WebGL) a static
              poster of it fills the same box, so the layout never changes. */}
          <div className="flex-1 h-[500px] w-full hidden lg:flex justify-center pointer-events-none">
            {desktop && !card.enabled && (
              <img
                src="/models/card-poster.webp"
                alt="Ilham Ramadhan's ID card"
                width={476}
                height={720}
                decoding="async"
                className="h-[340px] w-auto self-center rounded-xl shadow-2xl"
                data-testid="hero-card-poster"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
