import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { Seo } from '@/components/seo/Seo';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      toast.success('Already logged in. Redirecting...');
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors">
      <Seo title="Admin login" noindex />
      <div className="w-full max-w-sm bg-white border border-slate-200 dark:bg-slate-900 dark:border-white/10 rounded-2xl p-8 shadow-lg dark:shadow-none">
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">
          Admin login
        </h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8 text-sm">
          Sign in to manage your portfolio content.
        </p>

        <button
          onClick={() => void handleLogin()}
          disabled={isLoading}
          className="w-full py-3 bg-slate-800 hover:bg-slate-950 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="motion-safe:animate-spin h-5 w-5" />
          ) : (
            <>
              <Github className="h-5 w-5" /> Sign In with GitHub
            </>
          )}
        </button>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
