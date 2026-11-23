import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { addMessage } from './api';
import { messageKeys } from './queries';
import type { ContactState } from './contact-validation';

const COOLDOWN_SECONDS = 60;

export function ContactForm() {
  const t = useT();
  const queryClient = useQueryClient();
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
    mutationFn: addMessage,
    onSuccess: () => {
      // The success toast/state are handled by the call-level `onSuccess` in
      // `handleSubmit` (it also resets the form and starts the cooldown).
      // Invalidate messages query to refetch in admin panel if it's open
      void queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
    onError: () => {
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

    addMessageMutation.mutate(validation.data, {
      onSuccess: () => {
        toast.success(t.contact.sentToast);
        form.reset();
        setState({ success: true, message: t.contact.sentState });
        startCooldown();
      },
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-md mx-auto">
      {/* Honeypot — invisible to users, catches bots */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true" tabIndex={-1}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          {t.contact.name}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-4 py-3 rounded-lg bg-on-dark border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-on-dark/10 dark:text-on-dark placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder={t.contact.namePlaceholder}
          maxLength={100}
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          {t.contact.email}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-4 py-3 rounded-lg bg-on-dark border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-on-dark/10 dark:text-on-dark placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder={t.contact.emailPlaceholder}
          maxLength={320}
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          {t.contact.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-on-dark border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-on-dark/10 dark:text-on-dark placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          placeholder={t.contact.messagePlaceholder}
          maxLength={5000}
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.message && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.message[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={addMessageMutation.isPending || cooldown > 0}
        className="w-full px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-dark font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {addMessageMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" /> {t.contact.sending}
          </>
        ) : cooldown > 0 ? (
          <>{t.contact.wait(cooldown)}</>
        ) : (
          <>
            {t.contact.send} <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
