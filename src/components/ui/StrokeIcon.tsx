// Lucide's paths (ISC) for the four icons the listing routes use, drawn without lucide's runtime so /blog and
// /projects don't ship createLucideIcon on first load. ponytail: other routes keep lucide-react.
const PATHS = {
  x: 'M18 6 6 18M6 6l12 12',
  down: 'm6 9 6 6 6-6',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
} as const;

export function StrokeIcon({ name, className }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
