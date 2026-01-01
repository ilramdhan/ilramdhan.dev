import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getBlogBySlug, addComment as addCommentAPI, getComments } from '../lib/api';
import { ArrowLeft, Calendar, Tag, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCarousel } from '../components/ImageCarousel';
import ReactMarkdown from 'react-markdown';

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug!),
    enabled: !!slug,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['comments', blog?.id],
    queryFn: () => getComments(blog!.id),
    enabled: !!blog?.id,
  });

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: addCommentAPI,
    onSuccess: () => {
      toast.success("Comment added!");
      queryClient.invalidateQueries({ queryKey: ['comments', blog?.id] });
      setCommentName('');
      setCommentText('');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    }
  });

  // Comment State
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  if (isLoading) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
        </div>
    );
  }

  if (isError || !blog) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <button onClick={() => navigate('/blog')} className="text-indigo-600 dark:text-indigo-400 hover:underline">Back to Blog</button>
        </div>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !blog.id) return;
    
    addComment({ postId: blog.id, name: commentName, text: commentText });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <Navbar />
      
      <div className="w-full h-96 relative bg-slate-200 dark:bg-slate-900">
         {blog.images && blog.images.length > 0 ? (
             <ImageCarousel images={[blog.images[0]]} alt={blog.title || 'Blog Post'} aspectRatio="h-full" />
         ) : (
             <div className="w-full h-full bg-slate-200 dark:bg-slate-900" />
         )}
         
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full z-20 pb-12 pointer-events-auto">
            <div className="max-w-3xl mx-auto px-4">
                <button onClick={() => navigate('/blog')} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white mb-6 flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" /> Back to Blog</button>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                     <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}</span>
                     {blog.tags && blog.tags.length > 0 && (
                        <span className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400"><Tag className="h-4 w-4"/> {blog.tags.join(', ')}</span>
                     )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-slate-900 dark:text-white">{blog.title}</h1>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none mb-16">
             <p className="lead text-xl text-slate-600 dark:text-slate-300 mb-8 font-light">{blog.excerpt}</p>
             <ReactMarkdown>
                 {blog.content || ''}
             </ReactMarkdown>
        </div>

        <hr className="border-slate-200 dark:border-white/10 mb-12" />

        <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="h-6 w-6"/> Comments ({comments?.length || 0})</h3>
            
            <form onSubmit={handleCommentSubmit} className="mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                        type="text" 
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your Name"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Share your thoughts..."
                        rows={3}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isAddingComment}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isAddingComment ? 'Posting...' : <><Send className="h-4 w-4"/> Post Comment</>}
                </button>
            </form>

            <div className="space-y-6">
                {isLoadingComments ? <p>Loading comments...</p> : comments?.map(comment => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white">{comment.name}</h4>
                            <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{comment.content}</p>
                    </div>
                ))}
                {comments?.length === 0 && <p className="text-slate-500 italic">No comments yet. Be the first to share your thoughts!</p>}
            </div>
        </div>
      </div>
    </div>
  );
}