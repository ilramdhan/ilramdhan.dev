import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

export default function BlogDetailPage({ id }: { id: string }) {
  const { posts, addComment } = useStore();
  const { navigate } = useRouter();
  const post = posts.find(p => p.id === id);

  // Comment State
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  if (!post) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <button onClick={() => navigate('/blog')} className="text-indigo-400 hover:underline">Back to Blog</button>
        </div>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    
    addComment(post.id, { name: commentName, text: commentText });
    setCommentName('');
    setCommentText('');
    toast.success("Comment added!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      
      {/* Header Image */}
      <div className="w-full h-96 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
        <img src={post.cover_image} className="w-full h-full object-cover opacity-50" />
        <div className="absolute bottom-0 left-0 w-full z-20 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <button onClick={() => navigate('/blog')} className="text-slate-300 hover:text-white mb-6 flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" /> Back to Blog</button>
                <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
                     <Calendar className="h-4 w-4" /> {new Date(post.published_at).toLocaleDateString()}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-lg max-w-none mb-16">
             <p className="lead text-xl text-slate-300 mb-8 font-light">{post.excerpt}</p>
             <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                 {post.content}
             </div>
        </div>

        <hr className="border-white/10 mb-12" />

        {/* Comments Section */}
        <div className="mb-12">
            <h3 className="text-2xl font-bold mb-8">Comments ({post.comments.length})</h3>
            
            <div className="space-y-6 mb-12">
                {post.comments.length === 0 ? (
                    <p className="text-slate-500 italic">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    post.comments.map((comment, idx) => (
                        <div key={idx} className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {comment.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-sm">{comment.name}</span>
                                </div>
                                <span className="text-xs text-slate-500">{new Date(comment.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300 text-sm pl-10">{comment.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                <h4 className="font-bold mb-4">Leave a comment</h4>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Your Name" 
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <textarea 
                        rows={3} 
                        placeholder="Share your thoughts..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
                        Post Comment
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}