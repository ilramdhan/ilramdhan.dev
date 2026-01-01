import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getBlogBySlug, addComment as addCommentAPI } from '../lib/api';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
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

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: addCommentAPI,
    onSuccess: () => {
      toast.success("Comment added!");
      // Refetch the blog data to show the new comment
      queryClient.invalidateQueries({ queryKey: ['blog', slug] });
      setCommentName('');
      setCommentText('');
    },
    onError: () => {
      toast.error("Failed to add comment. Please try again.");
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
         {blog.image_url ? (
             <ImageCarousel images={[blog.image_url]} alt={blog.title || 'Blog Post'} aspectRatio="h-full" />
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
             <ReactMarkdown className="text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                 {blog.content || ''}
             </ReactMarkdown>
        </div>

        <hr className="border-slate-200 dark:border-white/10 mb-12" />

        {/* Comments Section - Temporarily commented out as comments are not yet implemented in DB schema */}
        
      </div>
    </div>
  );
}