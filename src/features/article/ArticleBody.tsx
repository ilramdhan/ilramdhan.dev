import type { ReactNode } from 'react';
import { Tile } from '@/components/tile/Tile';
import { ARTICLE_COLUMN, ARTICLE_GRID, TOC_MIN_HEADINGS } from './layout';
import { ShareBar } from './ShareBar';
import { TocDisclosure, TocSidebar } from './TableOfContents';
import type { TocHeading } from './toc';

/** The shared body: 680px column + TOC rail (lg+) or disclosure above the text (below lg), then share. */
export function ArticleBody({
  headings,
  title,
  url,
  children,
}: {
  headings: TocHeading[];
  title: string;
  url: string;
  children: ReactNode;
}) {
  const showToc = headings.length >= TOC_MIN_HEADINGS;
  return (
    // overflow-visible: the TOC rail is position:sticky.
    <Tile
      labelledBy="article-title"
      className="overflow-visible pt-[clamp(2.5rem,5vw,4rem)]"
      innerClassName="items-start text-left"
    >
      <div className={showToc ? ARTICLE_GRID : 'mx-auto w-full max-w-170'}>
        {showToc && (
          <div className="lg:order-1">
            <TocDisclosure headings={headings} />
            <TocSidebar headings={headings} />
          </div>
        )}
        <div className={showToc ? ARTICLE_COLUMN : 'min-w-0'}>
          {children}
          <div className="mt-10 border-t border-rule pt-4">
            <ShareBar title={title} url={url} />
          </div>
        </div>
      </div>
    </Tile>
  );
}
