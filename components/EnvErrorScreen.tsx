interface EnvErrorScreenProps {
  errors: string[];
}

/** Shown instead of the app when required environment variables are missing/invalid. */
export function EnvErrorScreen({ errors }: EnvErrorScreenProps) {
  return (
    <main
      role="alert"
      className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-slate-800 dark:text-slate-100"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-lg">
        <h1 className="text-xl font-bold">Site configuration error</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The site could not start because required environment variables are missing or invalid.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 font-mono text-sm text-red-600 dark:text-red-400">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
        {import.meta.env.DEV ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in the values and
            restart the dev server.
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Please try again later. If you are the site owner, set these variables in the hosting
            provider&apos;s environment settings and redeploy.
          </p>
        )}
      </div>
    </main>
  );
}
