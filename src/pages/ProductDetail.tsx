import React from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { ShoppingCart, Share2, Heart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onProductClick }) => {
  const relatedProducts = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-12 mb-16 md:mb-24">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="bg-white border-4 border-ink neo-shadow overflow-hidden aspect-square">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border-2 border-ink neo-shadow-sm aspect-square cursor-pointer hover:neo-shadow transition-all overflow-hidden">
                <img 
                  src={product.image} 
                  alt={`${product.name} view ${i}`}
                  className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div> */}
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-secondary-container border-2 border-ink px-2 py-1 font-label text-[10px] font-bold uppercase">{product.category}</span>
              <span className="font-label text-xs font-bold text-ink/50 uppercase tracking-widest">{product.store}</span>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase mb-4 leading-none">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <span className="font-headline font-black text-3xl md:text-4xl">Rs. {product.price}</span>
              {product.oldPrice && (
                <span className="font-headline font-bold text-2xl text-ink/30 line-through">Rs. {product.oldPrice}</span>
              )}
            </div>
          </div>

          <p className="font-body text-base md:text-lg text-ink/70 mb-6 leading-relaxed">
            {product.description}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {product.tags.map(tag => (
                <span key={tag} className="bg-ink text-white px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-8 mb-12">
            <div>
              <label className="font-label font-bold text-xs uppercase tracking-widest mb-4 block">AVAILABLE SIZE</label>
              <div className="w-14 h-14 border-4 border-ink font-headline font-black text-xl flex items-center justify-center bg-primary-container neo-shadow">
                {product.size || 'N/A'}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => onAddToCart(product)}
                className="flex-grow bg-primary-container border-4 border-ink py-4 md:py-5 font-headline font-black text-base md:text-xl neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center gap-3"
              >
                ADD TO CART <ShoppingCart size={24} />
              </button>
              <div className="grid grid-cols-2 sm:flex gap-3 md:gap-4">
              <button className="p-4 md:p-5 border-4 border-ink bg-white neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center">
                <Heart size={24} />
              </button>
              <button className="p-4 md:p-5 border-4 border-ink bg-white neo-shadow hover:neo-shadow-lg active-press transition-all flex items-center justify-center">
                <Share2 size={24} />
              </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-12 border-t-4 border-ink/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-tertiary" />
              <span className="font-label font-bold text-[10px] uppercase">AUTHENTICITY<br />GUARANTEED</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="text-tertiary" />
              <span className="font-label font-bold text-[10px] uppercase">WORLDWIDE<br />SHIPPING</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="text-tertiary" />
              <span className="font-label font-bold text-[10px] uppercase">7-DAY<br />RETURNS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete the Kit */}
      <section className="pt-16 md:pt-24 border-t-4 border-ink">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-12">
          <h2 className="font-headline font-black text-3xl md:text-5xl tracking-tighter uppercase">COMPLETE THE KIT</h2>
          <span className="font-label font-bold text-xs text-ink/50 uppercase tracking-widest">YOU MIGHT ALSO LIKE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {relatedProducts.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onAdd={(e) => {
                e.stopPropagation();
                onAddToCart(p);
              }}
              onClick={() => onProductClick(p)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
