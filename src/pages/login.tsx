import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Link } from '@/i18n/Link';
import { Github } from '@/components/ui/brand-icons';
import { useAuth } from '@/app/auth';
import { Seo } from '@/components/seo/Seo';
import { pillClass } from '@/components/tile/pill';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      toast.success('Already logged in. Redirecting...');
      void navigate('/admin');
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
    <section
      aria-labelledby="login-title"
      className="flex min-h-svh flex-col justify-center bg-white py-section text-ink"
    >
      <Seo title="Admin login" noindex />
      <div className="wrap flex flex-col items-center text-center">
        <h1 id="login-title" className="text-hero max-w-[14ch] text-ink">
          Admin login
        </h1>
        <p className="mt-4 max-w-[34ch] text-lead text-ink-muted">
          Sign in to manage your portfolio content.
        </p>
        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={isLoading}
          aria-busy={isLoading || undefined}
          className={cn(pillClass(), 'mt-10 min-w-64 gap-2 disabled:opacity-60')}
        >
          {isLoading ? (
            <span
              aria-hidden="true"
              className="size-5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
            />
          ) : (
            <>
              <Github className="size-5" aria-hidden /> Sign In with GitHub
            </>
          )}
        </button>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-11 items-center text-body text-action underline-offset-4 hover:underline"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
