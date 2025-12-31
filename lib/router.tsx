import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Route = '/' | '/projects' | '/blog' | '/contact' | '/login' | '/admin';

interface RouterContextType {
  path: string;
  navigate: (path: string) => void;
  queryParams: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>('/');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Handle initial load based on hash or default to /
    const hash = window.location.hash.slice(1) || '/';
    setPath(hash);
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate, queryParams }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
