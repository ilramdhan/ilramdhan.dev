import { useQuery } from '@tanstack/react-query';
// Direct module imports, not the barrels: the footer (entry chunk) imports the tile barrel, and through it Rollup
// would hoist every home-only partial into the entry that every route downloads.
import type { LinkedItem } from '@/components/tile/LinkedGroup';
import { LinkChevron } from '@/components/tile/LinkChevron';
import { PillButton } from '@/components/tile/PillButton';
import { SpecRow, type SpecItem } from '@/components/tile/SpecRow';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { TechIcon } from '@/features/tech-stack/TechIcon';
import { Marquee } from '@/components/motion/Marquee';
import { ScrollFill } from '@/components/motion/ScrollFill';
import { Hero } from '@/features/hero-3d/Hero';
import { LinkedRowOrNote, LinkedRowSkeleton } from '@/features/home/HomeRows';
import { firstParagraph, firstSentence, plainText } from '@/features/home/home-text';
import { colVar } from '@/components/tile/stagger';
import { MediaFrame } from '@/components/tile/MediaFrame';
import { homeJsonLd } from '@/components/seo/json-ld';
import { profileQueries } from '@/features/profile/queries';
import { projectQueries } from '@/features/projects/queries';
import { blogQueries } from '@/features/blog/queries';
import { certificateQueries } from '@/features/certificates/queries';
import { techStackQueries } from '@/features/tech-stack/queries';
import { serviceQueries } from '@/features/services/queries';
import { Seo } from '@/components/seo/Seo';
import { useLocale, useLocalePath, useT } from '@/i18n';

// Intrinsic ratio for photos whose URL carries no size (Img reads `_<w>x<h>` from uploads first).
const PHOTO = { width: 1600, height: 1200 };
// Hash targets (/#projects, /#blog, /#certificates): html's scroll-padding already clears the nav; the tile's own
// scroll-margin would add a second 44px gap.
const ANCHOR = 'scroll-mt-0';
// One row is enough for a total: the count header comes back with it.
const COUNT = { page: 1, limit: 1 } as const;
// The latest three certificates: one row at 1024px and up (the third is hidden below it, where the row holds two).
const LATEST_CERTS = { page: 1, limit: 3 } as const;

/**
 * Home (PLAN §3, mutugading home): hero with real counts, featured projects as a row of linked groups, services as
 * quiet text columns, the tools as a plain-text marquee, featured articles, one scroll-filled statement from the
 * profile, and a closing night tile pointing to /contact (D11). Every figure and line comes from the database; anything
 * missing is hidden, never invented.
 */
export default function Page() {
  const t = useT();
  const lp = useLocalePath();
  const locale = useLocale();

  const { data: profile } = useQuery(profileQueries.detail(locale));
  const projects = useQuery(projectQueries.featured(locale));
  const posts = useQuery(blogQueries.featured(locale));
  const { data: techStack } = useQuery(techStackQueries.list());
  const services = useQuery(serviceQueries.list(locale));
  const projectCount = useQuery(projectQueries.list(COUNT, locale));
  const postCount = useQuery(blogQueries.list(COUNT, locale));
  const certCount = useQuery(certificateQueries.list(COUNT, locale));
  const latestCerts = useQuery(certificateQueries.list(LATEST_CERTS, locale));
  const projectTotal = projectCount.data;
  const postTotal = postCount.data;
  const certTotal = certCount.data;
  const countsPending = projectCount.isPending || postCount.isPending || certCount.isPending;

  // Zero or unknown = hidden (a "0 articles" figure says nothing).
  const count = (n: number | undefined) => (n ? n : null);
  const specs: SpecItem[] = [
    { value: count(projectTotal?.count), label: t.home.specProjects },
    { value: count(postTotal?.count), label: t.home.specPosts },
    { value: count(certTotal?.count), label: t.home.specCertificates },
    { value: count(techStack?.length), label: t.home.specTech },
  ];

  const projectItems: LinkedItem[] | undefined = projects.data?.map((p) => ({
    id: String(p.id),
    title: p.title ?? '',
    line: p.short_description ?? undefined,
    href: lp(`/projects/${encodeURIComponent(p.slug ?? '')}`),
    image: p.images?.[0]
      ? {
          src: p.images[0],
          alt: p.title ? t.projects.screenshotOf(p.title) : t.projects.screenshot,
          ...PHOTO,
        }
      : null,
  }));
  const postItems: LinkedItem[] | undefined = posts.data?.map((p) => ({
    id: String(p.id),
    title: p.title ?? '',
    line: p.excerpt ?? undefined,
    href: lp(`/blog/${encodeURIComponent(p.slug ?? '')}`),
    // The title under the photo names the post: the photo itself is decorative here.
    image: p.images?.[0] ? { src: p.images[0], alt: '', ...PHOTO } : null,
  }));

  // No tagline column exists: the first sentence of the bio, real text only (hidden when there is none).
  const statement = firstSentence(firstParagraph(profile?.detailed_bio));
  const certItems: LinkedItem[] = (latestCerts.data?.data ?? []).map((c) => ({
    id: String(c.id),
    title: c.title,
    line: c.issued_by ?? undefined,
    href: lp('/certificates'),
    image: c.file_url
      ? { src: c.file_url, alt: t.certificates.alt(c.title, c.issued_by), ...PHOTO }
      : null,
  }));
  const tools = techStack?.map((s) => s.name).filter(Boolean) ?? [];

  return (
    <div>
      <Seo
        description={t.seo.homeDescription}
        jsonLd={
          import.meta.env.SSR
            ? homeJsonLd(locale, {
                description: t.seo.homeDescription,
                image: '/logo.png',
              })
            : undefined
        }
      />

      <Hero
        specs={
          countsPending ? (
            // Same row, invisible, while the counts load (a client-side visit): the hero never shifts.
            <div aria-hidden="true" className="invisible mt-stack w-full">
              <SpecRow
                items={specs.map((s) => ({ ...s, value: '0' }))}
                countUp={false}
                stagger={false}
              />
            </div>
          ) : (
            <SpecRow items={specs} stagger={false} className="mt-stack" />
          )
        }
      />

      <Tile id="projects" labelledBy="home-projects-h" tone="parchment" className={ANCHOR}>
        <TileHeading
          id="home-projects-h"
          title={t.home.featuredProjects}
          lead={t.home.featuredProjectsLead}
          links={<LinkChevron href={lp('/projects')}>{t.home.viewAllProjects}</LinkChevron>}
        />
        <div className="mt-stack w-full">
          {projects.isPending ? (
            <LinkedRowSkeleton label={t.home.loadingProjects} />
          ) : (
            <LinkedRowOrNote
              items={projectItems}
              moreLabel={t.home.viewProject}
              note={t.home.noFeaturedProjects}
              error={projects.isError && !projects.data && t.home.errorProjects}
            />
          )}
        </div>
      </Tile>

      {services.isPending || (services.data && services.data.length > 0) ? (
        <Tile labelledBy="home-services-h" backdrop={{ shape: 'dots' }}>
          <TileHeading id="home-services-h" title={t.home.whatIDo} lead={t.home.whatIDoLead} />
          <div className="mt-stack w-full">
            {services.data ? (
              // D6 (recorded D1 deviation): filled parchment/night tile-cards, radius, no border, no shadow.
              <ul className="stagger-row grid w-full grid-cols-1 gap-4 text-left lg:grid-cols-3 lg:gap-6">
                {services.data.map((svc, i) => {
                  const body = plainText(svc.description);
                  return (
                    <li
                      key={svc.id}
                      style={colVar(i, 3)}
                      className="rounded-[20px] bg-parchment p-8 nav:rounded-[28px] nav:p-10"
                    >
                      <h3 className="text-title text-balance text-tile-ink">{svc.title}</h3>
                      {body ? (
                        <p className="mt-2 text-body text-pretty text-tile-muted">{body}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <>
                <span className="sr-only" role="status">
                  {t.home.loadingServices}
                </span>
                <ul
                  aria-hidden="true"
                  className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6"
                >
                  {[0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="rounded-[20px] bg-parchment p-8 nav:rounded-[28px] nav:p-10"
                    >
                      <div className="h-[1.2em] w-1/2 rounded-sm bg-tile-frame text-title" />
                      <div className="mt-2 h-[2.9em] w-full rounded-sm bg-tile-frame text-body" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Tile>
      ) : null}

      {tools.length > 0 ? (
        <Tile labelledBy="home-tech-h" tone="parchment">
          <TileHeading id="home-tech-h" size="section" title={t.home.techHeading} />
          <div className="mt-stack w-full">
            <Marquee
              items={tools}
              label={t.home.techLabel}
              pauseLabel={t.motion.pauseList}
              playLabel={t.motion.playList}
              className="pb-9"
              itemClassName="px-2 sm:px-3"
              renderItem={(n) => (
                <TechIcon name={n} iconUrl={techStack?.find((s) => s.name === n)?.icon_url ?? ''} />
              )}
            />
          </div>
        </Tile>
      ) : null}

      <Tile id="blog" labelledBy="home-blog-h" className={ANCHOR}>
        <TileHeading
          id="home-blog-h"
          title={t.home.featuredArticles}
          lead={t.home.featuredArticlesLead}
          links={<LinkChevron href={lp('/blog')}>{t.home.readBlog}</LinkChevron>}
        />
        <div className="mt-stack w-full">
          {posts.isPending ? (
            <LinkedRowSkeleton label={t.home.loadingPosts} />
          ) : (
            <LinkedRowOrNote
              items={postItems}
              moreLabel={t.home.readPost}
              note={t.home.noFeaturedPosts}
              error={posts.isError && !posts.data && t.home.errorPosts}
            />
          )}
        </div>
      </Tile>

      {statement ? (
        <Tile
          labelledBy="home-statement-h"
          tone="parchment"
          align="split"
          size="roomy"
          backdrop={{ shape: 'rings', side: 'left' }}
        >
          <div className="order-2 flex flex-col items-start text-left lg:order-1">
            <h2 id="home-statement-h" className="sr-only">
              {t.home.statementHeading}
            </h2>
            <ScrollFill className="max-w-[24ch] text-section text-tile-ink" text={statement} />
            <LinkChevron href={lp('/about')} className="mt-8">
              {t.home.moreAboutMe}
            </LinkChevron>
          </div>
          <div className="order-1 w-full max-w-[20rem] justify-self-start lg:order-2 lg:justify-self-end">
            <MediaFrame
              src={profile?.avatar_url || null}
              alt={
                profile?.display_name ? t.about.portraitOf(profile.display_name) : t.about.portrait
              }
              width={512}
              height={640}
              aspect="portrait"
            />
          </div>
        </Tile>
      ) : null}

      {latestCerts.isPending || certItems.length > 0 ? (
        <Tile id="certificates" labelledBy="home-certs-h" className={ANCHOR}>
          <TileHeading
            id="home-certs-h"
            title={t.about.certificates}
            lead={t.certificates.lead}
            links={
              <LinkChevron href={lp('/certificates')}>{t.about.viewAllCertificates}</LinkChevron>
            }
          />
          <div className="mt-stack w-full">
            {latestCerts.data ? (
              <LinkedRowOrNote
                items={certItems}
                moreLabel={t.home.viewCertificates}
                note=""
                columns={3}
              />
            ) : (
              <LinkedRowSkeleton columns={3} label={t.home.loadingCertificates} />
            )}
          </div>
        </Tile>
      ) : null}

      <Tile
        id="contact"
        labelledBy="home-contact-h"
        tone="dark"
        size="roomy"
        className={ANCHOR}
        backdrop={{ shape: 'waves' }}
      >
        <TileHeading
          id="home-contact-h"
          title={t.home.contactTitle}
          lead={t.home.contactLead}
          links={<PillButton href={lp('/contact')}>{t.contact.formTitle}</PillButton>}
        />
      </Tile>
    </div>
  );
}
