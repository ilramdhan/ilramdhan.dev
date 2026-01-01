import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { getBlogs, getBlogTags } from '../lib/api';
import { useDebounce } from '../lib/hooks';
import { Calendar, Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function BlogPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: allBlogTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['blogTags'],
    queryFn: getBlogTags,
  });

  const { data: blogData, isLoading: isLoadingBlogs, isError: isErrorBlogs } = useQuery({
    queryKey: ['blogs', currentPage, selectedTag, debouncedSearchQuery],
    queryFn: () => getBlogs({ page: currentPage, limit: ITEMS_PER_PAGE, query: debouncedSearchQuery }),
    placeholderData: (previousData) => previousData,
  });

  const currentBlogs = blogData?.data ?? [];
  const totalBlogs = blogData?.count ?? 0;
  const totalPages = Math.ceil(totalBlogs / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (tag: string | null) => {
      setSelectedTag(tag);
      setCurrentPage(1);
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Writings</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Insights, thoughts, and tutorials on web development, design, and technology.</p>
            </div>
        </div>

        <div className="max-w-4xl mx-auto mb-12 space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search articles..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-12 pr-6 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm shadow-sm" 
                />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
                {isLoadingTags ? <div className="h-6 w-20 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-full" /> : allBlogTags?.map(tag => (
                    <button
                        key={tag}
                        onClick={() => handleFilterChange(tag === selectedTag ? null : tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            tag === selectedTag 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500 hover:text-indigo-500'
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid gap-8 max-w-3xl mx-auto mb-12">
            {isLoadingBlogs && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 w-full animate-pulse bg-slate-200 dark:bg-slate-800/50 rounded-2xl" />)}
            {isErrorBlogs && <div className="text-center text-red-500 py-10">Error loading articles.</div>}
            {currentBlogs.map(blog => (
                <article 
                    key={blog.id} 
                    onClick={() => blog.slug && navigate(`/blog/${blog.slug}`)}
                    className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 hover:shadow-lg dark:hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all cursor-pointer backdrop-blur-md"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 aspect-video md:aspect-square shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                             {blog.images && blog.images.length > 0 ? (
                                 <img src={blog.images[0]} alt={blog.title} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                             )}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}</span>
                                {blog.tags && blog.tags.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400"><Tag className="h-3 w-3" /> {blog.tags[0]}</span>
                                    </>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{blog.title}</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">{blog.excerpt}</p>
                            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Read more &rarr;</span>
                        </div>
                    </div>
                </article>
            ))}
            {currentBlogs.length === 0 && !isLoadingBlogs && (
                <div className="text-center text-slate-500 py-10">No articles found matching your criteria.</div>
            )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-center gap-2">
                <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
                <button 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
}