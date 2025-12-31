import React, { useState } from 'react';
import { useRouter } from '../lib/router';
import { useStore } from '../lib/store';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStore();
  const { navigate } = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock Authentication Logic
    await new Promise(r => setTimeout(r, 1000));
    
    if (email === 'admin@example.com' && password === 'admin') {
      login();
      toast.success("Welcome back, Admin!");
      navigate('/admin');
    } else {
      toast.error("Invalid credentials (try admin@example.com / admin)");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-500/10 rounded-full">
            <Lock className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-8">Admin Access</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <div className="text-xs text-slate-500 text-center">Hint: admin@example.com / admin</div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-white">Back to Home</button>
        </div>
      </div>
    </div>
  );
}
