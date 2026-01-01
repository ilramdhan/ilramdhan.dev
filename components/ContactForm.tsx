'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { validateContactForm, type ContactState } from '../actions/contact-actions';
import * as api from '../lib/api';

export function ContactForm() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ContactState>({});

  const addMessageMutation = useMutation({
    mutationFn: api.addMessage,
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setState({ success: true, message: 'Message sent successfully!' });
      // Invalidate messages query to refetch in admin panel if it's open
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const validation = await validateContactForm(formData);

    if (!validation.success) {
        setState({
            errors: validation.error,
            message: 'Missing Fields',
            success: false
        });
        return;
    }

    addMessageMutation.mutate(validation.data, {
      onSuccess: () => {
        toast.success("Message sent! We'll get back to you soon.");
        form.reset();
        setState({ success: true, message: 'Message sent successfully!' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-white/10 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="John Doe"
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-white/10 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="john@example.com"
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 dark:bg-slate-900 dark:border-white/10 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          placeholder="Tell me about your project..."
          disabled={addMessageMutation.isPending}
        />
        {state.errors?.message && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{state.errors.message[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={addMessageMutation.isPending}
        className="w-full px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {addMessageMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          <>
            Send Message <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}