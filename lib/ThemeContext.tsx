'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const updateFavicon = (currentTheme: 'dark' | 'light') => {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
          link.href = currentTheme === 'dark' ? '/logo/ir-dark.png' : '/logo/ir-light.png';
      } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = currentTheme === 'dark' ? '/logo/ir-dark.png' : '/logo/ir-light.png';
          document.head.appendChild(newLink);
      }
  };

  useEffect(() => {
    // Check local storage on mount
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        updateFavicon(savedTheme);
    } else {
        // Default to dark and save preference
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        updateFavicon('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateFavicon(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
