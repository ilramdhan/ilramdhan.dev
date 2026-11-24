import { Img } from './Img';

interface TechBadgeProps {
  name: string;
  iconUrl: string | null;
}

/** Tech-stack item: icon (or Simple Icons fallback) plus name, in quiet tile text (no hover effect: it is not a link). */
export function TechBadge({ name, iconUrl }: TechBadgeProps) {
  return (
    <div className="flex items-center gap-3 text-tile-muted">
      {iconUrl ? (
        <Img
          src={iconUrl}
          alt={name}
          width={32}
          height={32}
          className="h-8 w-8 object-contain dark:invert"
        />
      ) : (
        <Img
          src={`https://cdn.simpleicons.org/${name.toLowerCase().replace(/\s+/g, '')}/default`}
          alt={name}
          width={32}
          height={32}
          className="h-8 w-8 dark:invert"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <span className="text-title">{name}</span>
    </div>
  );
}
