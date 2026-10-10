import { Img } from './Img';

interface TechBadgeProps {
  name: string;
  iconUrl: string | null;
}

/** Tech-stack marquee item: icon (or Simple Icons fallback) plus name. */
export function TechBadge({ name, iconUrl }: TechBadgeProps) {
  return (
    <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
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
      <span className="text-lg font-bold text-slate-600 dark:text-slate-300">{name}</span>
    </div>
  );
}
