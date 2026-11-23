import { useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { localePath, splitLocale } from './locale';
import { en } from './messages/en';
import { useLocale, loadLocale } from './index';

const noSubscribe = () => () => {};
const KEY = 'locale-preference';

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const save = (value: 'en' | 'id') => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Private mode / blocked storage: the banner just shows again next visit.
  }
};

/**
 * First-visit offer on English pages when the browser prefers Indonesian and no choice is
 * saved. Never redirects (crawlers and shared links stay stable). Decided after mount so
 * the prerendered markup and hydration match.
 */
export function LocaleBanner() {
  const locale = useLocale();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  // false on the server and during hydration, so prerendered markup and first client render match.
  const offer = useSyncExternalStore(
    noSubscribe,
    () => locale === 'en' && read() === null && navigator.language.toLowerCase().startsWith('id'),
    () => false,
  );
  const show = offer && !dismissed;
  const setShow = (value: boolean) => setDismissed(!value);

  if (!show) return null;
  // `en.banner` is Indonesian on purpose: it is shown to Indonesian readers on the English page.
  const t = en.banner;
  const button =
    'min-h-11 min-w-11 rounded-lg px-4 py-2 text-sm font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500';
  return (
    <div
      role="region"
      aria-label={t.label}
      className="fixed inset-x-4 bottom-4 z-60 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-on-dark p-4 shadow-lg dark:border-on-dark/10 dark:bg-slate-900"
    >
      <p className="text-sm font-medium text-slate-900 dark:text-on-dark">{t.question}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            save('en');
            setShow(false);
          }}
          className={`${button} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}
        >
          {t.dismiss}
        </button>
        <button
          type="button"
          onClick={() => {
            save('id');
            setShow(false);
            const target = `${localePath(splitLocale(pathname).path, 'id')}${search}${hash}`;
            void loadLocale('id').then(() => navigate(target));
          }}
          className={`${button} bg-indigo-600 text-on-dark hover:bg-indigo-700`}
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
