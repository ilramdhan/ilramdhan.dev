import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';
import { Plus, Trash2, FolderKanban, Mail, LogOut, Settings, FileText, User, Edit, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { projects, posts, messages, profile, deleteProject, addProject, updateProject, deletePost, addPost, updatePost, updateProfile, logout } = useStore();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'blog' | 'messages'>('overview');
  
  // -- PROJECT STATES --
  const [isEditingProject, setIsEditingProject] = useState<string | null>(null); // ID of project being edited, or null
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', tech_stack: '', tags: '', demo_url: '', repo_url: '', thumbnail_url: '', content: '', is_featured: false
  });

  // -- BLOG STATES --
  const [isEditingPost, setIsEditingPost] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: '', excerpt: '', content: '', cover_image: '', tags: '', is_featured: false
  });

  // -- PROFILE STATE --
  const [profileForm, setProfileForm] = useState(profile);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info("Logged out successfully");
  };

  // --- PROFILE HANDLERS ---
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    toast.success("Profile updated!");
  };

  // --- PROJECT HANDLERS ---
  const openProjectForm = (project?: any) => {
      if (project) {
          setIsEditingProject(project.id);
          setProjectForm({
              title: project.title,
              description: project.description || '',
              tech_stack: project.tech_stack?.join(', ') || '',
              tags: project.tags?.join(', ') || '',
              demo_url: project.demo_url || '',
              repo_url: project.repo_url || '',
              thumbnail_url: project.thumbnail_url || '',
              content: project.content || '',
              is_featured: project.is_featured
          });
      } else {
          setIsEditingProject('NEW');
          setProjectForm({
              title: '', description: '', tech_stack: '', tags: '', demo_url: '', repo_url: '', thumbnail_url: 'https://picsum.photos/600/337', content: '', is_featured: false
          });
      }
  };

  const saveProject = (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
          title: projectForm.title,
          slug: projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: projectForm.description,
          content: projectForm.content,
          tech_stack: projectForm.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
          tags: projectForm.tags.split(',').map(s => s.trim()).filter(Boolean),
          demo_url: projectForm.demo_url,
          repo_url: projectForm.repo_url,
          thumbnail_url: projectForm.thumbnail_url,
          is_featured: projectForm.is_featured,
      };

      if (isEditingProject === 'NEW') {
          addProject({ ...payload, published_at: new Date().toISOString() });
          toast.success("Project created!");
      } else if (isEditingProject) {
          updateProject(isEditingProject, payload);
          toast.success("Project updated!");
      }
      setIsEditingProject(null);
  };

  // --- BLOG HANDLERS ---
  const openPostForm = (post?: any) => {
      if (post) {
          setIsEditingPost(post.id);
          setPostForm({
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              cover_image: post.cover_image,
              tags: post.tags?.join(', ') || '',
              is_featured: post.is_featured
          });
      } else {
          setIsEditingPost('NEW');
          setPostForm({ title: '', excerpt: '', content: '', cover_image: 'https://picsum.photos/800/400', tags: '', is_featured: false });
      }
  };

  const savePost = (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
          title: postForm.title,
          slug: postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: postForm.excerpt,
          content: postForm.content,
          cover_image: postForm.cover_image,
          tags: postForm.tags.split(',').map(s => s.trim()).filter(Boolean),
          is_featured: postForm.is_featured,
      };

      if (isEditingPost === 'NEW') {
          addPost({ ...payload, published_at: new Date().toISOString() });
          toast.success("Post created!");
      } else if (isEditingPost) {
          updatePost(isEditingPost, payload);
          toast.success("Post updated!");
      }
      setIsEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex pt-16">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/50 hidden md:block fixed h-full overflow-y-auto pb-20">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
          <div className="space-y-2">
            {['overview', 'projects', 'blog', 'messages'].map(t => (
                <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                <span className="capitalize">{t}</span>
                {t === 'messages' && messages.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{messages.length}</span>}
                </button>
            ))}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 mt-8"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8">
             <h2 className="text-xl font-bold text-white">Admin Panel</h2>
             <button onClick={handleLogout} className="text-red-400"><LogOut className="h-5 w-5"/></button>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
            {['overview', 'projects', 'blog', 'messages'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${activeTab === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-white/10 text-slate-400'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}
        </div>

        {activeTab === 'overview' && (
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold text-white mb-6">Landing Page Overview</h1>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-6 p-6 bg-slate-900 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Profile Info</h3>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                            <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Avatar URL (Transparent PNG recommended)</label>
                            <input value={profileForm.avatar_url} onChange={e => setProfileForm({...profileForm, avatar_url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Badge Text</label>
                            <input value={profileForm.badge} onChange={e => setProfileForm({...profileForm, badge: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Main Title</label>
                            <input value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Description</label>
                            <textarea rows={3} value={profileForm.description} onChange={e => setProfileForm({...profileForm, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                    </div>

                    <div className="grid gap-6 p-6 bg-slate-900 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Social Links (Leave empty to hide)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.keys(profileForm.socials).map((key) => (
                                <div key={key}>
                                    <label className="block text-sm text-slate-400 mb-1 capitalize">{key}</label>
                                    <input 
                                        value={profileForm.socials[key as keyof typeof profileForm.socials]} 
                                        onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, [key]: e.target.value}})} 
                                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Save Changes</button>
                </form>
            </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Manage Projects</h1>
              <button 
                onClick={() => openProjectForm()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Project
              </button>
            </div>

            {isEditingProject && (
              <div className="mb-8 p-6 bg-slate-900 border border-white/10 rounded-xl">
                <div className="flex justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{isEditingProject === 'NEW' ? 'Create Project' : 'Edit Project'}</h3>
                    <button onClick={() => setIsEditingProject(null)}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
                </div>
                <form onSubmit={saveProject} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Title" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                    <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg px-4">
                        <input type="checkbox" id="proj-featured" checked={projectForm.is_featured} onChange={e => setProjectForm({...projectForm, is_featured: e.target.checked})} className="w-4 h-4 rounded" />
                        <label htmlFor="proj-featured" className="text-slate-300 text-sm cursor-pointer select-none">Featured on Homepage</label>
                    </div>
                  </div>
                  <input required placeholder="Thumbnail URL" value={projectForm.thumbnail_url} onChange={e => setProjectForm({...projectForm, thumbnail_url: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  <textarea required placeholder="Short Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={2} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Tech Stack (comma separated)" value={projectForm.tech_stack} onChange={e => setProjectForm({...projectForm, tech_stack: e.target.value})} className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                      <input placeholder="Tags (comma separated, e.g. Fullstack, AI)" value={projectForm.tags} onChange={e => setProjectForm({...projectForm, tags: e.target.value})} className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  </div>
                  
                  <textarea placeholder="Content (Markdown supported - visualized as text)" value={projectForm.content} onChange={e => setProjectForm({...projectForm, content: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-sm" rows={6} />
                  
                  <div className="grid grid-cols-2 gap-4">
                     <input placeholder="Demo URL" value={projectForm.demo_url} onChange={e => setProjectForm({...projectForm, demo_url: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                     <input placeholder="Repo URL" value={projectForm.repo_url} onChange={e => setProjectForm({...projectForm, repo_url: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsEditingProject(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><Save className="h-4 w-4" /> Save Project</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <img src={project.thumbnail_url || ''} className="w-16 h-10 object-cover rounded" />
                    <div>
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <div className="flex gap-2 text-xs text-slate-500 mt-1">
                          {project.is_featured && <span className="text-indigo-400 border border-indigo-500/20 px-1 rounded">Featured</span>}
                          <span>{project.tech_stack?.length} techs</span>
                          <span>{project.tags?.length} tags</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openProjectForm(project)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteProject(project.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
             <div>
             <div className="flex justify-between items-center mb-6">
               <h1 className="text-2xl font-bold text-white">Manage Articles</h1>
               <button 
                 onClick={() => openPostForm()}
                 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 <Plus className="h-4 w-4" /> Write Article
               </button>
             </div>
 
             {isEditingPost && (
               <div className="mb-8 p-6 bg-slate-900 border border-white/10 rounded-xl">
                 <div className="flex justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{isEditingPost === 'NEW' ? 'Create Article' : 'Edit Article'}</h3>
                    <button onClick={() => setIsEditingPost(null)}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
                 </div>
                 <form onSubmit={savePost} className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required placeholder="Article Title" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg px-4">
                            <input type="checkbox" id="blog-featured" checked={postForm.is_featured} onChange={e => setPostForm({...postForm, is_featured: e.target.checked})} className="w-4 h-4 rounded" />
                            <label htmlFor="blog-featured" className="text-slate-300 text-sm cursor-pointer select-none">Featured on Homepage</label>
                        </div>
                   </div>
                   <input required placeholder="Cover Image URL" value={postForm.cover_image} onChange={e => setPostForm({...postForm, cover_image: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                   <input placeholder="Tags (comma separated, e.g. React, Tutorial)" value={postForm.tags} onChange={e => setPostForm({...postForm, tags: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                   <textarea required placeholder="Excerpt (Short summary)" value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={2} />
                   <textarea required placeholder="Full Content (Markdown supported)" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-sm" rows={10} />
                   
                   <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setIsEditingPost(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><Save className="h-4 w-4" /> Publish</button>
                   </div>
                 </form>
               </div>
             )}
 
             <div className="grid gap-4">
               {posts.map(post => (
                 <div key={post.id} className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-lg">
                   <div className="flex items-center gap-4">
                     <img src={post.cover_image} className="w-16 h-10 object-cover rounded" />
                     <div>
                       <h4 className="font-medium text-white">{post.title}</h4>
                       <div className="flex gap-4 text-xs text-slate-500 mt-1">
                            {post.is_featured && <span className="text-indigo-400 border border-indigo-500/20 px-1 rounded">Featured</span>}
                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                            <span>{post.comments.length} comments</span>
                            <span>{post.tags?.length || 0} tags</span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                        <button onClick={() => openPostForm(post)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePost(post.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Inbox</h1>
            {messages.length === 0 ? (
                <div className="text-slate-500">No messages received yet.</div>
            ) : (
                <div className="space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className="p-4 bg-slate-900 border border-white/5 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                        <h4 className="font-bold text-white">{msg.name}</h4>
                        <p className="text-xs text-indigo-400">{msg.email}</p>
                        </div>
                        <span className="text-xs text-slate-600">{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm bg-slate-950/50 p-3 rounded">{msg.message}</p>
                    </div>
                ))}
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
