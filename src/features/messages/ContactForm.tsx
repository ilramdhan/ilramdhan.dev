import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pillClass } from '@/components/tile/pill';
import { useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import Turnstile, { sendVerified } from './Turnstile';
import type { MessageInsert } from './api';
import type { ContactState } from './contact-validation';

const COOLDOWN_SECONDS = 60;

// D10: Cloudflare Turnstile + server verify (api/contact.ts) when the build has a site key. Without one: no widget,
// the anon-key insert (keeps a deploy without the env working until 20261127000000 removes anon inserts).
// This form only lives on the lazy /contact route; Cloudflare's api.js loads once the form nears the viewport.
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '';
const TOKEN_FIELD = 'cf-turnstile-response';

// mutugading FIELD: parchment fill, no stroke, 11px corners, 48px tall, 17px text. Focus and errors are a 2px outline
// (focus in the tile's action colour, never removed without a replacement).
const FIELD =
  'min-h-12 w-full rounded-md bg-parchment px-4 text-body text-ink outline-hidden placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-tile-action aria-invalid:outline-2 aria-invalid:outline-danger disabled:opacity-60';
// Signal red is tuned for light grounds; on a dark tile it uses the dark theme's red (7.5:1 on night).
// ponytail: literal value; becomes a `--tile-danger` token if a second dark-tile form appears.
const ERROR = 'text-caption text-danger [[data-tone=dark]_&]:text-[#ff6961]';

type FieldName = 'name' | 'email' | 'message';

export function ContactForm() {
  const t = useT();
  const locale = useLocale();
  const resetCaptcha = useRef<(() => void) | null>(null);
  const uid = useId();
  const [state, setState] = useState<ContactState>({});
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const addMessageMutation = useMutation({
    mutationFn: async ({ m, form }: { m: MessageInsert; form: FormData }) =>
      SITE_KEY ? sendVerified('/api/contact', form) : (await import('./api')).addMessage(m),
    // Success toast/state: the call-level `onSuccess` in `handleSubmit`. No admin-inbox invalidation: the admin tab
    // refetches on mount/focus anyway, and the query keys would pull a shared chunk into this route.
    onError: (error) => {
      // Any server answer may have spent the single-use token (siteverify runs before the insert): fetch a fresh one.
      resetCaptcha.current?.();
      // 403 = the Turnstile check failed or expired.
      if (error.message === '403') {
        setState({ message: t.contact.captcha, success: false });
        toast.error(t.contact.captcha);
        return;
      }
      toast.error(t.contact.error);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check — bots fill hidden fields
    if (formData.get('website')) return;

    if (cooldown > 0) {
      toast.error(t.contact.waitToast(cooldown));
      return;
    }

    // Loaded on submit, so zod stays out of the home page's initial JS.
    const { validateContactForm } = await import('./contact-validation');
    const validation = validateContactForm(formData, t.contact.validation);

    if (!validation.success) {
      setState({
        errors: validation.error,
        message: t.contact.missingFields,
        success: false,
      });
      return;
    }

    if (SITE_KEY && !formData.get(TOKEN_FIELD)) {
      setState({ message: t.contact.captcha, success: false });
      return;
    }

    addMessageMutation.mutate(
      { m: validation.data, form: formData },
      {
        onSuccess: () => {
          resetCaptcha.current?.();
          toast.success(t.contact.sentToast);
          form.reset();
          setState({ success: true, message: t.contact.sentState });
          startCooldown();
        },
      },
    );
  };

  const pending = addMessageMutation.isPending;
  /** Label + control + error, wired for assistive tech (the error is named by `aria-describedby`). */
  const field = (name: FieldName, label: string, control: (a11y: object) => React.ReactNode) => {
    const error = state.errors?.[name]?.[0];
    const errId = `${uid}-${name}-err`;
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={name} className="text-caption font-semibold text-tile-ink">
          {label}
        </label>
        {control({
          id: name,
          name,
          disabled: pending,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errId : undefined,
        })}
        {error ? (
          <p id={errId} className={ERROR}>
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-6">
      {/* Honeypot — invisible to users, catches bots */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true" tabIndex={-1}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {field('name', t.contact.name, (a) => (
          <input
            {...a}
            type="text"
            autoComplete="name"
            className={FIELD}
            placeholder={t.contact.namePlaceholder}
            maxLength={100}
          />
        ))}
        {field('email', t.contact.email, (a) => (
          <input
            {...a}
            type="email"
            autoComplete="email"
            spellCheck={false}
            className={FIELD}
            placeholder={t.contact.emailPlaceholder}
            maxLength={320}
          />
        ))}
      </div>
      {field('message', t.contact.message, (a) => (
        <textarea
          {...a}
          rows={5}
          className={cn(FIELD, 'resize-none py-3')}
          placeholder={t.contact.messagePlaceholder}
          maxLength={5000}
        />
      ))}

      {SITE_KEY ? (
        <Turnstile siteKey={SITE_KEY} action="contact" locale={locale} resetRef={resetCaptcha} />
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending || cooldown > 0}
          className={cn(
            pillClass('md'),
            'gap-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
          )}
        >
          {pending ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
              />{' '}
              {t.contact.sending}
            </>
          ) : cooldown > 0 ? (
            t.contact.wait(cooldown)
          ) : (
            t.contact.send
          )}
        </button>
        {/* Announces the outcome (validation summary or success) without moving focus. */}
        <p role="status" className="text-caption text-tile-muted">
          {state.message}
        </p>
      </div>
    </form>
  );
}
