import { Seo } from '@/components/seo/Seo';
import { Tile } from '@/components/tile/Tile';
import { TileHeading } from '@/components/tile/TileHeading';
import { PillButton } from '@/components/tile/PillButton';
import { useT } from '@/i18n';

/** 404 page: rendered for unknown URLs and for unknown project/blog slugs. */
export default function NotFoundPage() {
  const t = useT();
  return (
    <>
      <Seo title={t.seo.notFound} noindex />
      <Tile labelledBy="notfound-h" size="screen" align="center">
        <TileHeading id="notfound-h" as="h1" title={t.notFound.title} align="center" />
        <p className="mt-4 max-w-[48ch] text-body text-tile-muted">{t.notFound.body}</p>
        <div className="mt-8">
          <PillButton href="/">{t.common.backToHome}</PillButton>
        </div>
      </Tile>
    </>
  );
}
