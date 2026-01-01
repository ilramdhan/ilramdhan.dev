import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Database } from '../../types';

type Message = Database['public']['Tables']['messages']['Row'];

const ADMIN_ITEMS_PER_PAGE = 10;

export function MessagesTab() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages'],
        queryFn: api.getMessages,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.deleteMessage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.info('Message deleted.');
        },
    });

    const paginatedMessages = messages?.slice((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE) || [];
    const totalPages = Math.ceil((messages?.length || 0) / ADMIN_ITEMS_PER_PAGE);

    if (isLoading) return <div>Loading messages...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inbox ({messages?.length || 0})</h1>
            </div>

            {(messages?.length || 0) === 0 ? (
                <div className="text-slate-500 text-center py-12">No messages received yet.</div>
            ) : (
                <div className="space-y-4 mb-8">
                    {paginatedMessages.map((msg) => (
                        <div key={msg.id} className="p-4 rounded-lg border bg-white border-slate-200 dark:bg-slate-900 dark:border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{msg.name}</h4>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{msg.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                                    <button onClick={() => deleteMutation.mutate(msg.id)} title="Delete" className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm bg-slate-100 dark:bg-slate-950/50 p-3 rounded mt-2">
                                {msg.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded disabled:opacity-50">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-slate-500 dark:text-slate-400 text-sm py-2">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded disabled:opacity-50">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}