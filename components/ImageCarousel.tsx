import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: string; // e.g., 'aspect-video', 'aspect-square'
}

export function ImageCarousel({ images, alt, aspectRatio = 'aspect-video' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`w-full ${aspectRatio} bg-slate-800 flex items-center justify-center text-slate-500`}>
        No Image
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((curr) => (curr === images.length - 1 ? 0 : curr + 1));
  };

  return (
    <div className={`w-full ${aspectRatio} relative overflow-hidden group`}>
      <img 
        src={images[currentIndex]} 
        alt={`${alt} - ${currentIndex + 1}`} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {images.length > 1 && (
        <>
            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={prev} className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={next} className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`} 
                    />
                ))}
            </div>
        </>
      )}
    </div>
  );
}