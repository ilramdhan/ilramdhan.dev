import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useT } from '@/i18n';

export function ScrollToTop() {
  const t = useT();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          type="button"
          onClick={scrollToTop}
          className="motion-safe:animate-pop-in fixed bottom-8 right-8 z-50 p-3 bg-indigo-600 hover:bg-indigo-700 text-on-dark rounded-full shadow-lg border border-on-dark/10 transition-colors"
          aria-label={t.common.backToTop}
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
