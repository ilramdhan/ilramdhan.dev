import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../lib/api';
import { toast } from 'sonner';
import { Trash2, ChevronLeft, ChevronRight, CheckCircle, MailOpen } from 'lucide-react';
import { Database } from '../../types';

type Message = Database['public']['Tables']['messages']['Row'];

const ADMIN_ITEMS_PER_PAGE = 10;

export function MessagesTab() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

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

    const markReadMutation = useMutation({
        mutationFn: (id: number) => api.markMessageAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: api.markAllMessagesAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success('All messages marked as read.');
        }
    });

    const paginatedMessages = messages?.slice((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE) || [];
    const totalPages = Math.ceil((messages?.length || 0) / ADMIN_ITEMS_PER_PAGE);

    const handleSelect = (id: number) => {
        setSelectedMessages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedMessages.length} messages?`)) return;
        for (const id of selectedMessages) {
            await api.deleteMessage(id);
        }
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        setSelectedMessages([]);
        toast.success('Messages deleted.');
    };

    if (isLoading) return <div>Loading messages...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inbox ({messages?.length || 0})</h1>
                <div className="flex gap-2">
                    {selectedMessages.length > 0 && (
                        <button onClick={handleBulkDelete} className="btn-secondary text-red-500 border-red-200 hover:bg-red-50">Delete Selected ({selectedMessages.length})</button>
                    )}
                    <button onClick={() => markAllReadMutation.mutate()} className="btn-secondary"><CheckCircle className="h-4 w-4 mr-2"/> Mark All Read</button>
                </div>
            </div>

            {(messages?.length || 0) === 0 ? (
                <div className="text-slate-500 text-center py-12">No messages received yet.</div>
            ) : (
                <div className="space-y-4 mb-8">
                    {paginatedMessages.map((msg) => (
                        <div key={msg.id} className={`p-4 rounded-lg border ${msg.is_read ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/30'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={selectedMessages.includes(msg.id)} onChange={() => handleSelect(msg.id)} />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {msg.name}
                                            {!msg.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                                        </h4>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{msg.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                                    {!msg.is_read && (
                                        <button onClick={() => markReadMutation.mutate(msg.id)} title="Mark as Read" className="p-1 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 rounded">
                                            <MailOpen className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button onClick={() => deleteMutation.mutate(msg.id)} title="Delete" className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mt-2 whitespace-pre-wrap">
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