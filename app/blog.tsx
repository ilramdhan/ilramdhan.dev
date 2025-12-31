import React from 'react';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { Calendar, Search } from 'lucide-react';

export default function BlogPage() {
  const { posts } = useStore();
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Writings</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Insights, thoughts, and tutorials on web development, design, and technology.</p>
        </div>

        <div className="max-w-2xl mx-auto mb-12 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input type="text" placeholder="Search articles..." className="w-full bg-slate-900 border border-white/10 rounded-full py-3 pl-12 pr-6 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="grid gap-8 max-w-3xl mx-auto">
            {posts.map(post => (
                <article 
                    key={post.id} 
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="group bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 hover:bg-slate-900 hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 aspect-video md:aspect-square shrink-0 rounded-lg overflow-hidden bg-slate-800">
                             <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.published_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>5 min read</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{post.title}</h2>
                            <p className="text-slate-400 mb-4">{post.excerpt}</p>
                            <span className="text-indigo-400 text-sm font-medium hover:underline">Read more &rarr;</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
      </div>
    </div>
  );
}