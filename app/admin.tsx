import React, { useState, useEffect } from 'react';
import { useStore, Experience, Education } from '../lib/store';
import { useRouter } from '../lib/router';
import { Plus, Trash2, FolderKanban, Mail, LogOut, Settings, FileText, User, Edit, X, Save, CheckCheck, ExternalLink, Briefcase, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_ITEMS_PER_PAGE = 5;

export default function AdminPage() {
  const { 
    projects, posts, messages, profile, experience, education,
    deleteProject, addProject, updateProject, 
    deletePost, addPost, updatePost, 
    updateProfile, setExperience, updateExperience, setEducation, updateEducation,
    markMessageRead, markAllMessagesRead, deleteMessage,
    logout 
  } = useStore();
  
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'projects' | 'blog' | 'messages'>('overview');
  
  // -- PAGINATION STATES --
  const [projectPage, setProjectPage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);

  // -- PROJECT STATES --
  const [isEditingProject, setIsEditingProject] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', tech_stack: '', tags: '', demo_url: '', repo_url: '', images: '', content: '', is_featured: false
  });

  // -- BLOG STATES --
  const [isEditingPost, setIsEditingPost] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: '', excerpt: '', content: '', images: '', tags: '', is_featured: false
  });

  // -- PROFILE STATE --
  const [profileForm, setProfileForm] = useState<typeof profile>(profile || {
    logo_text: '', logo_url: '', name: '', avatar_url: '', title: '', description: '', detailed_bio: '', address: '', resume_url: '', badge: '',
    socials: { github: '', linkedin: '', twitter: '', instagram: '', youtube: '', whatsapp: '', mail: '', steam: '' }
  });

  useEffect(() => {
    if (profile) setProfileForm(profile);
  }, [profile]);

  // -- RESUME STATES --
  const [expForm, setExpForm] = useState({ role: '', company: '', period: '', description: '', tags: '' });
  const [eduForm, setEduForm] = useState({ degree: '', school: '', period: '', gpa: '', description: '', tags: '' });
  
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);

  // Unread Messages Count
  const unreadCount = messages ? messages.filter(m => !m.is_read).length : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info("Logged out successfully");
  };

  // Helper for Pagination
  const paginate = (items: any[], page: number) => {
    if (!items) return [];
    return items.slice((page - 1) * ADMIN_ITEMS_PER_PAGE, page * ADMIN_ITEMS_PER_PAGE);
  };
  const getTotalPages = (items: any[]) => Math.ceil((items?.length || 0) / ADMIN_ITEMS_PER_PAGE);

  // --- PROFILE HANDLERS ---
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    toast.success("Profile settings updated!");
  };

  // --- EXPERIENCE HANDLERS ---
  const handleEditExp = (exp?: Experience) => {
      if (exp) {
          setEditingExpId(exp.id);
          setExpForm({
              role: exp.role,
              company: exp.company,
              period: exp.period,
              description: exp.description || '',
              tags: exp.tags?.join(', ') || ''
          });
      } else {
          setEditingExpId(null); // Adding new
          setExpForm({ role: '', company: '', period: '', description: '', tags: '' });
      }
      setShowExpForm(true);
  };

  const saveExperience = (e: React.FormEvent) => {
      e.preventDefault();
      const tagsArray = expForm.tags.split(',').map(s => s.trim()).filter(Boolean);
      
      if (editingExpId) {
          updateExperience(editingExpId, { ...expForm, tags: tagsArray });
          toast.success("Experience updated!");
      } else {
          setExperience([...experience, { ...expForm, id: Math.random().toString(36).substr(2, 9), tags: tagsArray }]);
          toast.success("Experience added!");
      }
      setShowExpForm(false);
  };
  const handleDeleteExp = (id: string) => setExperience(experience.filter(e => e.id !== id));

  // --- EDUCATION HANDLERS ---
  const handleEditEdu = (edu?: Education) => {
      if (edu) {
          setEditingEduId(edu.id);
          setEduForm({
              degree: edu.degree,
              school: edu.school,
              period: edu.period,
              gpa: edu.gpa || '',
              description: edu.description || '',
              tags: edu.tags?.join(', ') || ''
          });
      } else {
          setEditingEduId(null);
          setEduForm({ degree: '', school: '', period: '', gpa: '', description: '', tags: '' });
      }
      setShowEduForm(true);
  };

  const saveEducation = (e: React.FormEvent) => {
      e.preventDefault();
      const tagsArray = eduForm.tags.split(',').map(s => s.trim()).filter(Boolean);

      if (editingEduId) {
          updateEducation(editingEduId, { ...eduForm, tags: tagsArray });
          toast.success("Education updated!");
      } else {
          setEducation([...education, { ...eduForm, id: Math.random().toString(36).substr(2, 9), tags: tagsArray }]);
          toast.success("Education added!");
      }
      setShowEduForm(false);
  };
  const handleDeleteEdu = (id: string) => setEducation(education.filter(e => e.id !== id));


  // --- PROJECT HANDLERS ---
  const openProjectForm = (project?: any) => {
      if (project) {
          setIsEditingProject(project.id);
          setProjectForm({
              title: project.title || '',
              description: project.description || '',
              tech_stack: project.tech_stack?.join(', ') || '',
              tags: project.tags?.join(', ') || '',
              demo_url: project.demo_url || '',
              repo_url: project.repo_url || '',
              images: project.images?.join('\n') || '',
              content: project.content || '',
              is_featured: !!project.is_featured
          });
      } else {
          setIsEditingProject('NEW');
          setProjectForm({
              title: '', description: '', tech_stack: '', tags: '', demo_url: '', repo_url: '', images: '', content: '', is_featured: false
          });
      }
  };

  const saveProject = (e: React.FormEvent) => {
      e.preventDefault();
      const imageArray = projectForm.images.split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
          title: projectForm.title,
          slug: projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: projectForm.description,
          content: projectForm.content,
          tech_stack: (projectForm.tech_stack || '').split(',').map(s => s.trim()).filter(Boolean),
          tags: (projectForm.tags || '').split(',').map(s => s.trim()).filter(Boolean),
          demo_url: projectForm.demo_url,
          repo_url: projectForm.repo_url,
          images: imageArray.length > 0 ? imageArray : ['https://picsum.photos/600/337'],
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
              title: post.title || '',
              excerpt: post.excerpt || '',
              content: post.content || '',
              images: post.images?.join('\n') || '',
              tags: post.tags?.join(', ') || '',
              is_featured: !!post.is_featured
          });
      } else {
          setIsEditingPost('NEW');
          setPostForm({ title: '', excerpt: '', content: '', images: '', tags: '', is_featured: false });
      }
  };

  const savePost = (e: React.FormEvent) => {
      e.preventDefault();
      const imageArray = postForm.images.split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
          title: postForm.title,
          slug: postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: postForm.excerpt,
          content: postForm.content,
          images: imageArray.length > 0 ? imageArray : ['https://picsum.photos/800/400'],
          tags: (postForm.tags || '').split(',').map(s => s.trim()).filter(Boolean),
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
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
          
          <div className="space-y-1">
            <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors mb-4 border border-white/5">
                <ExternalLink className="h-4 w-4" /> Back to Website
            </button>

            {[
                {id: 'overview', icon: User, label: 'Overview'},
                {id: 'resume', icon: Briefcase, label: 'Resume'},
                {id: 'projects', icon: FolderKanban, label: 'Projects'},
                {id: 'blog', icon: FileText, label: 'Blog'},
                {id: 'messages', icon: Mail, label: 'Messages'},
            ].map(t => (
                <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
                {t.id === 'messages' && unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
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
             <div className="flex gap-4">
                 <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white"><ExternalLink className="h-5 w-5"/></button>
                 <button onClick={handleLogout} className="text-red-400"><LogOut className="h-5 w-5"/></button>
             </div>
        </div>

        {activeTab === 'overview' && (
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-white mb-6">Site Overview & Branding</h1>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Branding */}
                    <div className="grid gap-6 p-6 bg-slate-900 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Logo & Branding</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Logo Text (used if no image)</label>
                                <input value={profileForm?.logo_text || ''} onChange={e => setProfileForm({...profileForm, logo_text: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Logo Image URL</label>
                                <input value={profileForm?.logo_url || ''} onChange={e => setProfileForm({...profileForm, logo_url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid gap-6 p-6 bg-slate-900 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                                <input value={profileForm?.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Job Title</label>
                                <input value={profileForm?.badge || ''} onChange={e => setProfileForm({...profileForm, badge: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Address / Location</label>
                                <input value={profileForm?.address || ''} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Resume / CV Download URL</label>
                                <input value={profileForm?.resume_url || ''} onChange={e => setProfileForm({...profileForm, resume_url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm text-slate-400 mb-1">Hero Title</label>
                            <input value={profileForm?.title || ''} onChange={e => setProfileForm({...profileForm, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Short Description (Hero)</label>
                            <textarea rows={2} value={profileForm?.description || ''} onChange={e => setProfileForm({...profileForm, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm text-slate-400 mb-1">Avatar URL (Transparent PNG recommended)</label>
                            <input value={profileForm?.avatar_url || ''} onChange={e => setProfileForm({...profileForm, avatar_url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Detailed Bio (About Page)</label>
                            <textarea rows={5} value={profileForm?.detailed_bio || ''} onChange={e => setProfileForm({...profileForm, detailed_bio: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                        </div>
                    </div>

                    <div className="grid gap-6 p-6 bg-slate-900 border border-white/10 rounded-xl">
                        <h3 className="text-lg font-medium text-white border-b border-white/5 pb-2">Social Links</h3>
                        {profileForm?.socials ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.keys(profileForm.socials).map((key) => (
                                  <div key={key}>
                                      <label className="block text-sm text-slate-400 mb-1 capitalize">{key}</label>
                                      <input 
                                          value={profileForm.socials[key as keyof typeof profileForm.socials] || ''} 
                                          onChange={e => setProfileForm({
                                            ...profileForm, 
                                            socials: {
                                              ...profileForm.socials, 
                                              [key]: e.target.value
                                            }
                                          })} 
                                          className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" 
                                      />
                                  </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Social links data not available.</div>
                        )}
                    </div>

                    <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"><Save className="h-4 w-4" /> Save Changes</button>
                </form>
            </div>
        )}

        {activeTab === 'resume' && (
            <div className="max-w-4xl">
                 <h1 className="text-2xl font-bold text-white mb-6">Resume / CV Management</h1>
                 {/* Experience Section */}
                 <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Work Experience</h2>
                        <button onClick={() => handleEditExp()} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add</button>
                    </div>

                    {showExpForm && (
                        <form onSubmit={saveExperience} className="bg-slate-900 p-6 rounded-xl border border-white/10 mb-6 space-y-4">
                            <h3 className="text-white font-medium mb-2">{editingExpId ? 'Edit Experience' : 'New Experience'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Role / Position" required value={expForm.role} onChange={e => setExpForm({...expForm, role: e.target.value})} className="bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                                <input placeholder="Company Name" required value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} className="bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Period (e.g. 2020 - Present)" required value={expForm.period} onChange={e => setExpForm({...expForm, period: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                                <input placeholder="Tags (comma separated)" value={expForm.tags} onChange={e => setExpForm({...expForm, tags: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <textarea placeholder="Description" required value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" rows={2} />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowExpForm(false)} className="text-slate-400 text-sm">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">{editingExpId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {experience && experience.map(exp => (
                            <div key={exp.id} className="bg-slate-900 border border-white/5 p-4 rounded-lg flex justify-between items-start group">
                                <div>
                                    <h3 className="font-bold text-white">{exp.role}</h3>
                                    <div className="text-indigo-400 text-sm">{exp.company} • {exp.period}</div>
                                    <p className="text-slate-400 text-sm mt-1 mb-2">{exp.description}</p>
                                    {exp.tags && exp.tags.length > 0 && (
                                        <div className="flex gap-2">
                                            {exp.tags.map(t => <span key={t} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">{t}</span>)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditExp(exp)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteExp(exp.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Education Section */}
                 <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Education</h2>
                        <button onClick={() => handleEditEdu()} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add</button>
                    </div>

                    {showEduForm && (
                        <form onSubmit={saveEducation} className="bg-slate-900 p-6 rounded-xl border border-white/10 mb-6 space-y-4">
                            <h3 className="text-white font-medium mb-2">{editingEduId ? 'Edit Education' : 'New Education'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Degree" required value={eduForm.degree} onChange={e => setEduForm({...eduForm, degree: e.target.value})} className="bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                                <input placeholder="School / University" required value={eduForm.school} onChange={e => setEduForm({...eduForm, school: e.target.value})} className="bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Period (e.g. 2015 - 2019)" required value={eduForm.period} onChange={e => setEduForm({...eduForm, period: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                                <input placeholder="GPA (Optional)" value={eduForm.gpa} onChange={e => setEduForm({...eduForm, gpa: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            </div>
                            <input placeholder="Tags (comma separated)" value={eduForm.tags} onChange={e => setEduForm({...eduForm, tags: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" />
                            <textarea placeholder="Description (Optional)" value={eduForm.description} onChange={e => setEduForm({...eduForm, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white" rows={2} />
                            
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowEduForm(false)} className="text-slate-400 text-sm">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">{editingEduId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {education && education.map(edu => (
                            <div key={edu.id} className="bg-slate-900 border border-white/5 p-4 rounded-lg flex justify-between items-start group">
                                <div>
                                    <h3 className="font-bold text-white">{edu.degree}</h3>
                                    <div className="text-purple-400 text-sm">{edu.school} • {edu.period}</div>
                                    {edu.gpa && <div className="text-slate-300 text-xs mt-1">GPA: {edu.gpa}</div>}
                                    {edu.description && <p className="text-slate-400 text-sm mt-1">{edu.description}</p>}
                                    {edu.tags && edu.tags.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {edu.tags.map(t => <span key={t} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">{t}</span>)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditEdu(edu)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteEdu(edu.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea required placeholder="Image URLs (one per line)" value={projectForm.images} onChange={e => setProjectForm({...projectForm, images: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-xs" rows={4} />
                    <textarea required placeholder="Short Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={4} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Tech Stack (comma separated)" value={projectForm.tech_stack} onChange={e => setProjectForm({...projectForm, tech_stack: e.target.value})} className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                      <input placeholder="Tags (comma separated, e.g. Fullstack, AI)" value={projectForm.tags} onChange={e => setProjectForm({...projectForm, tags: e.target.value})} className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                  </div>
                  
                  <textarea placeholder="Content (Markdown supported)" value={projectForm.content} onChange={e => setProjectForm({...projectForm, content: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-sm" rows={6} />
                  
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

            <div className="grid gap-4 mb-8">
              {projects && paginate(projects, projectPage).map(project => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <img src={project.images?.[0] || ''} className="w-16 h-10 object-cover rounded" />
                    <div>
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <div className="flex gap-2 text-xs text-slate-500 mt-1">
                          {project.is_featured && <span className="text-indigo-400 border border-indigo-500/20 px-1 rounded">Featured</span>}
                          <span>{project.tech_stack?.length} techs</span>
                          <span>{project.images?.length || 0} images</span>
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
            
             {/* Pagination */}
             {getTotalPages(projects) > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setProjectPage(p => Math.max(1, p - 1))} disabled={projectPage === 1} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronLeft className="h-4 w-4 text-white" /></button>
                    <span className="text-slate-400 text-sm py-2">Page {projectPage} of {getTotalPages(projects)}</span>
                    <button onClick={() => setProjectPage(p => Math.min(getTotalPages(projects), p + 1))} disabled={projectPage === getTotalPages(projects)} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronRight className="h-4 w-4 text-white" /></button>
                </div>
            )}
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <textarea placeholder="Image URLs (one per line)" value={postForm.images} onChange={e => setPostForm({...postForm, images: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-xs" rows={4} />
                       <input placeholder="Tags (comma separated)" value={postForm.tags} onChange={e => setPostForm({...postForm, tags: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" />
                   </div>
                   <textarea required placeholder="Excerpt" value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" rows={2} />
                   <textarea required placeholder="Full Content (Markdown supported)" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-sm" rows={10} />
                   
                   <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setIsEditingPost(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><Save className="h-4 w-4" /> Publish</button>
                   </div>
                 </form>
               </div>
             )}
 
             <div className="grid gap-4 mb-8">
               {posts && paginate(posts, blogPage).map(post => (
                 <div key={post.id} className="flex items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-lg">
                   <div className="flex items-center gap-4">
                     <img src={post.images?.[0] || ''} className="w-16 h-10 object-cover rounded" />
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
             
             {getTotalPages(posts) > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setBlogPage(p => Math.max(1, p - 1))} disabled={blogPage === 1} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronLeft className="h-4 w-4 text-white" /></button>
                    <span className="text-slate-400 text-sm py-2">Page {blogPage} of {getTotalPages(posts)}</span>
                    <button onClick={() => setBlogPage(p => Math.min(getTotalPages(posts), p + 1))} disabled={blogPage === getTotalPages(posts)} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronRight className="h-4 w-4 text-white" /></button>
                </div>
            )}
           </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-white">Inbox ({messages?.length || 0})</h1>
                 {unreadCount > 0 && (
                     <button onClick={markAllMessagesRead} className="text-sm text-indigo-400 hover:text-indigo-300">Mark all as read</button>
                 )}
            </div>
            
            {(messages?.length || 0) === 0 ? (
                <div className="text-slate-500 text-center py-12">No messages received yet.</div>
            ) : (
                <div className="space-y-4 mb-8">
                {paginate(messages, messagePage).map((msg, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border transition-all ${msg.is_read ? 'bg-slate-900 border-white/5 opacity-75' : 'bg-slate-800 border-indigo-500/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {!msg.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                            <div>
                                <h4 className="font-bold text-white">{msg.name}</h4>
                                <p className="text-xs text-indigo-400">{msg.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                            {!msg.is_read && (
                                <button onClick={() => markMessageRead(msg.id)} title="Mark Read" className="p-1 text-slate-400 hover:text-white"><CheckCheck className="h-4 w-4" /></button>
                            )}
                            <button onClick={() => deleteMessage(msg.id)} title="Delete" className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm bg-slate-950/30 p-3 rounded mt-2">{msg.message}</p>
                    </div>
                ))}
                </div>
            )}
            
            {getTotalPages(messages) > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setMessagePage(p => Math.max(1, p - 1))} disabled={messagePage === 1} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronLeft className="h-4 w-4 text-white" /></button>
                    <span className="text-slate-400 text-sm py-2">Page {messagePage} of {getTotalPages(messages)}</span>
                    <button onClick={() => setMessagePage(p => Math.min(getTotalPages(messages), p + 1))} disabled={messagePage === getTotalPages(messages)} className="p-2 bg-slate-900 rounded disabled:opacity-50"><ChevronRight className="h-4 w-4 text-white" /></button>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}