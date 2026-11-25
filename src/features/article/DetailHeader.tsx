import type { ReactNode } from 'react';
import { Chevron } from '@/components/tile/LinkChevron';
import { Tile } from '@/components/tile/Tile';
import { useLocale, useT } from '@/i18n';
import { Link } from '@/i18n/Link';
import { NotTranslated } from '@/i18n/NotTranslated';
import { formatDate } from '@/lib/date';
import { TagLinks } from './ArticleFooter';

const CRUMB =
  'inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline-offset-4 hover:text-tile-ink hover:underline';

/**
 * The one header of blog and project detail: breadcrumbs, title, subtitle, meta row (date, reading time, extra,
 * tags), action pills, then the hero photo (`children`). `id="article-title"` names the page's sections.
 */
export function DetailHeader({
  listPath,
  listLabel,
  item,
  title,
  subtitle,
  date,
  minutes,
  extra,
  tags,
  actions,
  children,
}: {
  listPath: string;
  listLabel: string;
  item: { isTranslated?: boolean };
  title: string;
  subtitle?: string | null;
  date?: string | null;
  minutes: number;
  /** One more muted meta fact (e.g. the tech stack). */
  extra?: string;
  tags: string[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const t = useT();
  const locale = useLocale();
  const crumbs: [string, string][] = [
    ['/', t.article.home],
    [listPath, listLabel],
  ];
  return (
    <Tile
      labelledBy="article-title"
      enter
      className="pb-0 pt-6 sm:pb-0 sm:pt-6"
      innerClassName="items-start text-left"
    >
      <header className="w-full">
        <nav aria-label={t.article.breadcrumb}>
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1 text-fine text-tile-muted">
            {crumbs.map(([to, label]) => (
              <li key={to} className="flex items-center gap-1">
                <Link to={to} className={CRUMB}>
                  {label}
                </Link>
                <Chevron className="h-2.5 w-[5px]" />
              </li>
            ))}
            <li className="min-w-0">
              <span aria-current="page" className="block truncate px-1 text-tile-ink">
                {title}
              </span>
            </li>
          </ol>
        </nav>
        <div className="animate-rise mx-auto mt-6 flex max-w-208 flex-col items-center gap-4 text-center">
          <NotTranslated item={item} />
          <h1 id="article-title" className="text-tile wrap-break-word text-tile-ink">
            {title}
          </h1>
          {subtitle && <p className="text-lead text-pretty text-tile-ink">{subtitle}</p>}
          <p className="text-caption text-tile-muted">
            {date && (
              <>
                <time dateTime={date}>{formatDate(date, locale)}</time>
                {', '}
              </>
            )}
            <span>{t.common.minRead(minutes)}</span>
            {extra && <span>{`, ${extra}`}</span>}
          </p>
          <TagLinks tags={tags} basePath={listPath} className="justify-center" />
          {actions && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {actions}
            </div>
          )}
        </div>
        {children}
      </header>
    </Tile>
  );
}
