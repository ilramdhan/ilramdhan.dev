import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
// Direct module imports, not the barrels (see STATE.md Gotchas).
import { ActionLink } from '@/components/tile/ActionLink';
import { FeatureColumns, type FeatureColumn } from '@/components/tile/FeatureColumns';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { MediaFrame } from '@/components/tile/MediaFrame';
import { SpecRow, type SpecItem } from '@/components/tile/SpecRow';
import { colVar } from '@/components/tile/stagger';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { CountUp, GrowBar } from '@/components/motion/GrowBar';
import { Markdown } from '@/components/ui/Markdown';
import { CertificateCard } from '@/components/ui/CertificateCard';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Img } from '@/components/ui/Img';
import { Seo } from '@/components/seo/Seo';
import { siteConfig } from '@/config/site';
import { useTheme } from '@/app/ThemeContext';
import { profileQueries } from '@/features/profile/queries';
import { certificateQueries } from '@/features/certificates/queries';
import { PROSE, ResumeRows } from '@/features/resume/ResumeRows';
import { resumeQueries } from '@/features/resume/queries';
import { techStackQueries } from '@/features/tech-stack/queries';
import { WAKATIME_STATS_HEIGHT } from '@/features/wakatime/WakatimeStats';
import { wakatimeQueries } from '@/features/wakatime/queries';
import { ensureFullUrl } from '@/lib/utils';
import { useLocale, useLocalePath, useT } from '@/i18n';

// recharts (~100 KB gzip) is only needed for this one chart (T-24).
const WakatimeStats = lazy(() => import('@/features/wakatime/WakatimeStats'));

const githubUser = (url: string | undefined) => {
  try {
    return new URL(url ?? '').pathname.substring(1);
  } catch {
    return '';
  }
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The page's first screen in its real shape (copy lines + portrait frame) while the profile loads: nothing shifts. */
function AboutSkeleton({ label }: { label: string }) {
  return (
    <Tile labelledBy="about-loading-h" align="split">
      <span id="about-loading-h" className="sr-only" role="status">
        {label}
      </span>
      <div aria-hidden="true" className="flex w-full flex-col gap-4">
        <div className="h-[1.1em] w-3/4 rounded-sm bg-tile-frame text-hero" />
        <div className="h-[1.4em] w-full rounded-sm bg-tile-frame text-body" />
        <div className="h-[1.4em] w-full rounded-sm bg-tile-frame text-body" />
        <div className="h-[1.4em] w-2/3 rounded-sm bg-tile-frame text-body" />
      </div>
      <div
        aria-hidden="true"
        className="aspect-[4/5] w-full rounded-lg bg-tile-frame motion-safe:animate-pulse lg:max-w-[28rem] lg:justify-self-end"
      />
    </Tile>
  );
}

export default function AboutPage() {
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();
  const { theme } = useTheme();

  const { data: profile, isLoading: isLoadingProfile } = useQuery(profileQueries.detail(locale));
  const { data: experience, isLoading: isLoadingExp } = useQuery(
    resumeQueries.list('experience', locale),
  );
  const { data: education, isLoading: isLoadingEdu } = useQuery(
    resumeQueries.list('education', locale),
  );
  const { data: certificates, isLoading: isLoadingCerts } = useQuery(
    certificateQueries.all(locale),
  );
  const { data: techStack } = useQuery(techStackQueries.list());
  const {
    data: wakatime,
    isLoading: isLoadingWakatime,
    isError: isWakatimeError,
  } = useQuery(wakatimeQueries.languages());
  const { data: activity, isError: isActivityError } = useQuery(wakatimeQueries.activity());

  if (isLoadingProfile || isLoadingExp || isLoadingEdu || isLoadingCerts) {
    return (
      <>
        <Seo title={t.seo.about} description={t.seo.aboutDescription} />
        <AboutSkeleton label={t.about.loading} />
      </>
    );
  }

  const username = githubUser(
    ensureFullUrl((profile?.social_links as Record<string, string> | null)?.github),
  );
  const resumeUrl = ensureFullUrl(profile?.resume_url);
  const name = profile?.display_name || t.about.fallbackHeading;

  // Skills: the tech stack grouped by its category, one quiet column per group.
  const groups = new Map<string, string[]>();
  for (const s of techStack ?? []) {
    const key = s.category?.trim() ?? '';
    groups.set(key, [...(groups.get(key) ?? []), s.name]);
  }
  const skills: FeatureColumn[] = [...groups.entries()]
    .filter(([key]) => key)
    .map(([key, names]) => ({ key, title: cap(key), body: names.join(', ') }));

  // WakaTime figures: unknown = hidden (never a placeholder number).
  const languages = !isWakatimeError ? (wakatime?.data ?? []).slice(0, 5) : [];
  const monthSeconds = !isActivityError ? (activity ?? []).reduce((s, d) => s + d.total, 0) : 0;
  const figures: SpecItem[] = [
    {
      value: monthSeconds > 0 ? Math.round(monthSeconds / 360) / 10 : null,
      label: t.about.activityMonth,
    },
    { value: languages[0]?.name, label: t.about.languagesWeek },
  ];
  const wakaPending = isLoadingWakatime;
  const showWaka = wakaPending || languages.length > 0 || (!!activity && !isActivityError);

  const certs = certificates ?? [];

  return (
    <div>
      <Seo title={t.seo.about} description={t.seo.aboutDescription} />

      <Tile labelledBy="about-h" align="split">
        <div className="flex flex-col items-start gap-6 text-left">
          <TileHeading
            id="about-h"
            as="h1"
            title={name}
            align="start"
            className="animate-rise-still"
          />
          <div className="animate-rise [animation-delay:120ms]">
            <div className={PROSE}>
              <Markdown components={{ h1: 'h2' }}>{profile?.detailed_bio || ''}</Markdown>
            </div>
            {profile?.address ? (
              <p className="mt-4 text-body text-tile-muted">{profile.address}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2">
              {resumeUrl ? (
                <ActionLink
                  variant="primary"
                  link={{ kind: 'external', href: resumeUrl, label: t.about.downloadCv }}
                />
              ) : null}
              <SocialLinks
                links={profile?.social_links}
                containerClassName="flex flex-wrap items-center"
                linkClassName="inline-grid size-11 place-items-center rounded-full text-tile-action transition-colors duration-200 hover:bg-parchment hover:text-tile-action-hover"
                iconClassName="h-5 w-5"
              />
            </div>
          </div>
        </div>
        <div className="w-full max-w-[28rem] justify-self-center lg:justify-self-end">
          <MediaFrame
            src={profile?.avatar_url || null}
            alt={
              profile?.display_name ? t.about.portraitOf(profile.display_name) : t.about.portrait
            }
            width={512}
            height={640}
            aspect="portrait"
            priority
            parallax={6}
          />
        </div>
      </Tile>

      {(experience?.length ?? 0) + (education?.length ?? 0) > 0 ? (
        <Tile labelledBy="about-resume-h" tone="parchment">
          <TileHeading id="about-resume-h" title={t.about.experience} />
          <div className="mt-stack grid w-full gap-x-16 gap-y-12 text-left lg:grid-cols-2">
            {experience?.length ? (
              <div>
                <h3 className="mb-2 text-title text-tile-ink">{t.about.experience}</h3>
                <ResumeRows items={experience} prefix="exp" />
              </div>
            ) : null}
            {education?.length ? (
              <div>
                <h3 className="mb-2 text-title text-tile-ink">{t.about.education}</h3>
                <ResumeRows items={education} prefix="edu" />
              </div>
            ) : null}
          </div>
        </Tile>
      ) : null}

      {skills.length > 0 ? (
        <Tile labelledBy="about-skills-h">
          <TileHeading id="about-skills-h" title={t.home.techHeading} />
          <div className="mt-stack w-full">
            <FeatureColumns items={skills} />
          </div>
        </Tile>
      ) : null}

      {showWaka ? (
        <Tile labelledBy="about-code-h" tone="parchment">
          <TileHeading id="about-code-h" title={t.about.codingActivity} />
          {wakaPending ? (
            <div
              aria-hidden="true"
              className="mt-stack w-full rounded-lg bg-tile-frame motion-safe:animate-pulse"
              style={{ height: WAKATIME_STATS_HEIGHT }}
            />
          ) : (
            <div className="mt-stack flex w-full flex-col gap-stack">
              <SpecRow items={figures} wrap />
              {languages.length > 0 ? (
                <div className="mx-auto w-full max-w-3xl text-left">
                  <h3 className="mb-6 text-title text-tile-ink">{t.about.languagesWeek}</h3>
                  <ul className="flex flex-col gap-5">
                    {languages.map((lang) => (
                      <li key={lang.name}>
                        <div className="mb-2 flex justify-between gap-4 text-body">
                          <span className="text-tile-ink">{lang.name}</span>
                          <span className="tabular text-tile-muted">
                            {lang.text} (
                            <CountUp
                              value={lang.percent}
                              decimals={String(lang.percent).split('.')[1]?.length ?? 0}
                              suffix="%"
                            />
                            )
                          </span>
                        </div>
                        <GrowBar percent={lang.percent} label={lang.name} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activity && !isActivityError ? (
                <div className="mx-auto w-full max-w-3xl">
                  <Suspense
                    fallback={
                      <div
                        aria-hidden="true"
                        className="w-full rounded-lg bg-tile-frame"
                        style={{ height: WAKATIME_STATS_HEIGHT }}
                      />
                    }
                  >
                    <WakatimeStats data={activity} />
                  </Suspense>
                </div>
              ) : null}
            </div>
          )}
        </Tile>
      ) : null}

      {certs.length > 0 ? (
        <Tile labelledBy="about-certs-h">
          <TileHeading
            id="about-certs-h"
            title={t.about.certificates}
            lead={t.certificates.lead}
            links={
              certs.length > 3 ? (
                <LinkChevron href={lp('/certificates')}>{t.about.viewAllCertificates}</LinkChevron>
              ) : undefined
            }
          />
          <ul className="stagger-row mt-stack grid w-full gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {certs.slice(0, 3).map((cert, i) => (
              <li key={cert.id} style={colVar(i, 3)}>
                <CertificateCard cert={cert} />
              </li>
            ))}
          </ul>
        </Tile>
      ) : null}

      {username ? (
        <Tile labelledBy="about-github-h" tone="parchment">
          <TileHeading id="about-github-h" title={t.footer.socialName.github} />
          <div className="mt-stack flex w-full flex-col items-center gap-stack">
            <a
              href={`https://github.com/${username}`}
              className="block w-full overflow-hidden rounded-lg bg-tile-frame"
              style={{ aspectRatio: '1200 / 420' }}
            >
              <Img
                width={1200}
                height={420}
                src={`https://github-act-graph.rodriaum.com/graph?username=${username}&${theme === 'dark' ? 'bg_color=232325&color=F5F5F7&line=F5F5F7&point=F5F5F7' : 'bg_color=E8E8ED&color=1D1D1F&line=1D1D1F&point=1D1D1F'}&area=true&hide_border=true`}
                alt={t.about.githubGraph(username)}
                className="h-full w-full object-contain"
              />
            </a>
            <Img
              width={880}
              height={192}
              src={`https://raw.githubusercontent.com/${siteConfig.githubUsername}/Snake-in-Contribution-Grid/output/github-contribution-grid-snake.svg`}
              alt={t.about.githubSnake}
              className="h-auto max-w-full"
            />
          </div>
        </Tile>
      ) : null}
    </div>
  );
}
