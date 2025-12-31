import React, { useState } from 'react';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { Calendar, Search, Tag } from 'lucide-react';

export default function BlogPage() {
  const { posts } = useStore();
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract tags
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  // Filter Logic
  const filteredPosts = posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Writings</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Insights, thoughts, and tutorials on web development, design, and technology.</p>
        </div>

        <div className="max-w-4xl mx-auto mb-12 space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search articles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-full py-3 pl-12 pr-6 text-white focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm" 
                />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            tag === selectedTag 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-white/30'
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid gap-8 max-w-3xl mx-auto">
            {filteredPosts.map(post => (
                <article 
                    key={post.id} 
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="group bg-slate-900/60 border border-white/5 rounded-2xl p-6 md:p-8 hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all cursor-pointer backdrop-blur-md"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 aspect-video md:aspect-square shrink-0 rounded-lg overflow-hidden bg-slate-800">
                             <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.published_at).toLocaleDateString()}</span>
                                {post.tags && post.tags.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-indigo-400"><Tag className="h-3 w-3" /> {post.tags[0]}</span>
                                    </>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{post.title}</h2>
                            <p className="text-slate-400 mb-4">{post.excerpt}</p>
                            <span className="text-indigo-400 text-sm font-medium hover:underline">Read more &rarr;</span>
                        </div>
                    </div>
                </article>
            ))}
            {filteredPosts.length === 0 && (
                <div className="text-center text-slate-500 py-10">No articles found matching your criteria.</div>
            )}
        </div>
      </div>
    </div>
  );
}
