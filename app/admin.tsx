import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useRouter } from '../lib/router';
import { Plus, Trash2, FolderKanban, Mail, LogOut, Settings, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { projects, posts, messages, profile, deleteProject, addProject, deletePost, addPost, updateProfile, logout } = useStore();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'blog' | 'messages'>('overview');
  
  // State for adding items
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState(profile);
  const [newProject, setNewProject] = useState({ title: '', description: '', tech_stack: '', demo_url: '', repo_url: '', thumbnail_url: 'https://picsum.photos/600/337' });
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', content: '', cover_image: 'https://picsum.photos/800/400' });

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info("Logged out successfully");
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    toast.success("Profile updated!");
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({
      title: newProject.title,
      slug: newProject.title.toLowerCase().replace(/\s+/g, '-'),
      description: newProject.description,
      content: '',
      tech_stack: newProject.tech_stack.split(',').map(s => s.trim()),
      demo_url: newProject.demo_url,
      repo_url: newProject.repo_url,
      thumbnail_url: newProject.thumbnail_url,
      is_featured: true,
      published_at: new Date().toISOString(),
    });
    setIsAddingProject(false);
    setNewProject({ title: '', description: '', tech_stack: '', demo_url: '', repo_url: '', thumbnail_url: 'https://picsum.photos/600/337' });
    toast.success("Project added!");
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    addPost({
        title: newPost.title,
        slug: newPost.title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: newPost.excerpt,
        content: newPost.content,
        cover_image: newPost.cover_image,
        published_at: new Date().toISOString(),
    });
    setIsAddingPost(false);
    setNewPost({ title: '', excerpt: '', content: '', cover_image: 'https://picsum.photos/800/400' });
    toast.success("Article published!");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex pt-16">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/50 hidden md:block fixed h-full overflow-y-auto pb-20">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <User className="h-4 w-4" /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <FolderKanban className="h-4 w-4" /> Projects
            </button>
            <button 
              onClick={() => setActiveTab('blog')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'blog' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <FileText className="h-4 w-4" /> Blog
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <Mail className="h-4 w-4" /> Messages
              {messages.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{messages.length}</span>}
            </button>
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
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Hero Section</h3>
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
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Social Links</h3>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">GitHub URL</label>
                            <input value={profileForm.socials.github} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, github: e.target.value}})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">LinkedIn URL</label>
                            <input value={profileForm.socials.linkedin} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, linkedin: e.target.value}})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm text-slate-400 mb-1">Twitter/X URL</label>
                            <input value={profileForm.socials.twitter} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, twitter: e.target.value}})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
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
                onClick={() => setIsAddingProject(!isAddingProject)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Project
              </button>
            </div>

            {isAddingProject && (
              <div className="mb-8 p-6 bg-slate-900 border border-white/10 rounded-xl">
                <form onSubmit={handleSubmitProject} className="space-y-4">
                  <input required placeholder="Title" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  <textarea required placeholder="Description" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={3} />
                  <input required placeholder="Tech Stack (comma separated)" value={newProject.tech_stack} onChange={e => setNewProject({...newProject, tech_stack: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  <div className="grid grid-cols-2 gap-4">
                     <input placeholder="Demo URL" value={newProject.demo_url} onChange={e => setNewProject({...newProject, demo_url: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                     <input placeholder="Repo URL" value={newProject.repo_url} onChange={e => setNewProject({...newProject, repo_url: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save Project</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img src={project.thumbnail_url || ''} className="w-16 h-10 object-cover rounded" />
                    <div>
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <div className="flex gap-2 text-xs text-slate-500 mt-1">
                          {project.is_featured && <span className="text-indigo-400">Featured</span>}
                          <span>{project.tech_stack?.length} techs</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteProject(project.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                 onClick={() => setIsAddingPost(!isAddingPost)}
                 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 <Plus className="h-4 w-4" /> Write Article
               </button>
             </div>
 
             {isAddingPost && (
               <div className="mb-8 p-6 bg-slate-900 border border-white/10 rounded-xl">
                 <form onSubmit={handleSubmitPost} className="space-y-4">
                   <input required placeholder="Article Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                   <textarea required placeholder="Excerpt (Short summary)" value={newPost.excerpt} onChange={e => setNewPost({...newPost, excerpt: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={2} />
                   <textarea required placeholder="Full Content (Markdown supported)" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-sm" rows={10} />
                   <input placeholder="Cover Image URL" value={newPost.cover_image} onChange={e => setNewPost({...newPost, cover_image: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                   
                   <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setIsAddingPost(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Publish</button>
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
                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                            <span>{post.comments.length} comments</span>
                       </div>
                     </div>
                   </div>
                   <button onClick={() => deletePost(post.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                     <Trash2 className="h-4 w-4" />
                   </button>
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