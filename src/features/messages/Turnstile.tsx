import { useEffect, useRef } from 'react';
import { whenNear } from '@/components/motion/near';
import { useTheme } from '@/app/ThemeContext';
import type { Locale } from '@/i18n/locale';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
type TurnstileWindow = Window & { turnstile?: TurnstileApi; onTurnstileLoad?: () => void };

let loading: Promise<TurnstileApi> | null = null;

/** Injects api.js once (explicit rendering; `onload` is Cloudflare's documented ready hook for async scripts). */
function loadTurnstile(): Promise<TurnstileApi> {
  const w = window as TurnstileWindow;
  return (loading ??= new Promise((resolve, reject) => {
    w.onTurnstileLoad = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('turnstile')));
    const s = document.createElement('script');
    s.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    s.async = true;
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  }));
}

/**
 * The widget, rendered into the form so its token posts with the fields. The script loads only once the form comes
 * near the viewport; the widget re-renders when the site theme or the locale changes. `resetRef` gets a function
 * that clears the token after a send (each token is single-use).
 */
export default function Turnstile({
  siteKey,
  locale,
  resetRef,
}: {
  siteKey: string;
  locale: Locale;
  resetRef: { current: (() => void) | null };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let api: TurnstileApi | null = null;
    let id: string | null = null;
    let alive = true;
    const stop = whenNear(el, () => {
      loadTurnstile()
        .then((t) => {
          if (!alive) return;
          api = t;
          id = t.render(el, { sitekey: siteKey, theme, language: locale, size: 'flexible' });
          resetRef.current = () => id && t.reset(id);
        })
        // Blocked or offline: no token, so the submit says the check is missing.
        .catch(() => undefined);
    });
    return () => {
      alive = false;
      stop();
      if (api && id) api.remove(id);
      resetRef.current = null;
    };
  }, [siteKey, theme, locale, resetRef]);

  return <div ref={ref} className="min-h-[65px] w-full" data-turnstile="" />;
}

/** Turnstile mode (D10): posts the form (fields, honeypot, token) to the verifying function; throws the HTTP status on failure. */
// eslint-disable-next-line react-refresh/only-export-components -- one module, tree-shaken out when the flag is off
export async function sendVerified(form: FormData): Promise<{ success: true }> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    body: new URLSearchParams(form as unknown as Record<string, string>),
  });
  if (!res.ok) throw new Error(String(res.status));
  return { success: true };
}
