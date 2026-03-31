import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white border-4 border-ink transition-all cursor-pointer flex flex-col h-full active-press overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden border-b-4 border-ink bg-surface-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.oldPrice && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-tertiary text-white border-2 border-ink px-2 py-1 font-label text-xs font-bold neo-shadow-sm">
            SALE
          </div>
        )}
        {product.size && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white text-ink border-2 border-ink px-2 py-0.5 font-label text-[10px] font-bold neo-shadow-sm uppercase">
            SIZE: {product.size}
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <span className="font-label text-[10px] font-bold text-ink/50 uppercase tracking-widest line-clamp-1 pr-2">{product.store}</span>
        </div>
        
        <h3 className="font-headline font-black text-base sm:text-lg leading-tight mb-4 group-hover:text-tertiary transition-colors">{product.name}</h3>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-ink/40 line-through font-label">Rs.{product.oldPrice}</span>
            )}
            <span className="text-lg sm:text-xl font-black font-headline">Rs.{product.price}</span>
          </div>
          
          <button 
            onClick={onAdd}
            className="p-2.5 sm:p-2 bg-primary-container border-2 border-ink neo-shadow-sm hover:opacity-80 active-press transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
