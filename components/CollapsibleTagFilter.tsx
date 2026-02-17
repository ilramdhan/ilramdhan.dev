import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleTagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onTagClick: (tag: string | null) => void;
  maxVisible?: number;
  isLoading?: boolean;
  prefix?: string;
}

export function CollapsibleTagFilter({
  tags,
  selectedTag,
  onTagClick,
  maxVisible = 6,
  isLoading = false,
  prefix = '',
}: CollapsibleTagFilterProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) return null;

  const hasOverflow = tags.length > maxVisible;
  const visibleTags = expanded ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedTag && (
        <button
          onClick={() => onTagClick(null)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
      {visibleTags.map(tag => (
        <button
          key={tag}
          onClick={() => onTagClick(tag === selectedTag ? null : tag)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            tag === selectedTag
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500 hover:text-indigo-500'
          }`}
        >
          {prefix}{tag}
        </button>
      ))}
      {hasOverflow && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> +{hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
