import { useLocale, useT } from './index';

/** "Not yet translated" note for `/id` items that fell back to English (T-41). */
export function NotTranslated({ item }: { item: { isTranslated?: boolean } | null | undefined }) {
  const t = useT();
  if (useLocale() === 'en' || !item || item.isTranslated !== false) return null;
  return (
    <p
      role="note"
      data-testid="not-translated"
      className="mb-4 text-sm text-slate-500 dark:text-slate-400"
    >
      {t.content.notTranslated}
    </p>
  );
}
