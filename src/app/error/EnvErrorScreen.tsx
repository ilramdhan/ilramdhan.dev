interface EnvErrorScreenProps {
  errors: string[];
}

/** Shown instead of the app when required environment variables are missing/invalid. */
export function EnvErrorScreen({ errors }: EnvErrorScreenProps) {
  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-ink"
    >
      <div className="w-full max-w-[60ch]">
        <h1 className="text-tile font-semibold">Site configuration error</h1>
        <p className="mt-4 text-body text-ink-muted">
          The site could not start because required environment variables are missing or invalid.
        </p>
        <ul className="mt-6 list-disc space-y-1 pl-5 font-mono text-fine text-danger">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
        {import.meta.env.DEV ? (
          <p className="mt-6 text-body text-ink-muted">
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in the values and
            restart the dev server.
          </p>
        ) : (
          <p className="mt-6 text-body text-ink-muted">
            Please try again later. If you are the site owner, set these variables in the hosting
            provider&apos;s environment settings and redeploy.
          </p>
        )}
      </div>
    </main>
  );
}
