import { Seo } from '@/components/seo/Seo';
import { Link } from '@/i18n/Link';
import { useT } from '@/i18n';

/** 404 page: rendered for unknown URLs and for unknown project/blog slugs. */
export default function NotFoundPage() {
  const t = useT();
  return (
    <>
      <Seo title={t.seo.notFound} noindex />
      <section className="w-full bg-white text-ink flex min-h-svh flex-col justify-center py-section">
        <div className="wrap flex flex-col items-center text-center">
          <h1 className="text-hero max-w-[14ch] text-tile-ink">{t.notFound.title}</h1>
          <p className="mt-4 max-w-[48ch] text-body text-tile-muted">{t.notFound.body}</p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-tile-pill px-[22px] py-[11px] text-body text-tile-pill-ink transition-[background-color,scale] duration-200 ease-apple hover:bg-tile-pill-hover active:scale-[0.98] motion-reduce:transition-none"
          >
            {t.common.backToHome}
          </Link>
          <nav aria-label={t.notFound.title} className="mt-4 flex gap-6">
            {(['projects', 'blog'] as const).map((key) => (
              <Link
                key={key}
                to={`/${key}`}
                className="inline-flex min-h-11 items-center text-body text-action underline-offset-4 hover:underline"
              >
                {t.nav[key]}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
