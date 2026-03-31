import React from 'react';
import { Store } from '../types';
import { Star, ArrowUpRight } from 'lucide-react';

interface StoreCardProps {
  store: Store;
  onClick: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white border-[3px] sm:border-4 border-ink neo-shadow hover:neo-shadow-lg transition-all cursor-pointer flex flex-col h-full active-press overflow-hidden"
    >
      <div className="relative h-28 sm:h-44 lg:h-48 overflow-hidden border-b-[3px] sm:border-b-4 border-ink">
        <img 
          src={store.image} 
          alt={store.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute top-2 left-2 sm:top-4 sm:left-4 ${store.color} border-2 border-ink px-1.5 sm:px-2 py-0.5 sm:py-1 font-label text-[9px] sm:text-xs font-bold neo-shadow-sm`}>
          {store.initials}
        </div>
        {store.category && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white border-2 border-ink px-1.5 sm:px-2 py-0.5 sm:py-1 font-label text-[8px] sm:text-[10px] font-bold uppercase neo-shadow-sm">
            {store.category}
          </div>
        )}
      </div>
      
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1.5 sm:mb-2">
          <h3 className="font-headline font-black text-sm sm:text-xl leading-tight line-clamp-2 pr-2">{store.name}</h3>
          <ArrowUpRight size={15} className="sm:w-[18px] sm:h-[18px] shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </div>
        
        <p className="text-[11px] sm:text-sm text-ink/70 mb-2.5 sm:mb-4 line-clamp-3 sm:line-clamp-2 flex-grow leading-snug">
          {store.description}
        </p>
        
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2.5 sm:mb-4">
          {store.tags.map(tag => (
            <span key={tag} className="font-label text-[8px] sm:text-[10px] font-bold bg-surface-container border border-ink px-1.5 py-0.5 uppercase">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-ink/15 mt-auto">
          <div className="flex items-center gap-1">
            <Star size={11} className="sm:w-[13px] sm:h-[13px] fill-secondary-container text-ink" />
            <span className="font-label text-[9px] sm:text-xs font-bold">{store.rating}</span>
          </div>
          <span className="font-label text-[9px] sm:text-xs font-bold text-ink/50">{store.itemCount} ITEMS</span>
        </div>
      </div>
    </div>
  );
};
