import React from 'react';
import { Product, Page } from '../types';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartProps {
  items: Product[];
  onRemove: (id: string) => void;
  setPage: (page: Page) => void;
}

export const Cart: React.FC<CartProps> = ({ items, onRemove, setPage }) => {
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  const shipping = items.length > 0 ? 60 : 0;
  const total = subtotal + shipping;

  return (
    <div className="py-10 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <h1 className="font-headline font-black text-4xl sm:text-6xl md:text-8xl tracking-tighter uppercase mb-8 md:mb-16">YOUR CART</h1>

      {items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3 space-y-6">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="bg-white border-4 border-ink p-4 md:p-6 neo-shadow flex flex-col sm:flex-row gap-4 md:gap-6">
                <div className="w-full sm:w-32 max-w-[140px] aspect-square border-2 border-ink overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline font-black text-xl md:text-2xl uppercase pr-3">{item.name}</h3>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-ink/30 hover:text-tertiary transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <span className="font-label text-xs font-bold text-ink/50 uppercase tracking-widest">{item.store}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-4">
                    <span className="font-label text-xs font-bold uppercase tracking-widest text-ink/45">
                      Single item
                    </span>
                    <span className="font-headline font-black text-xl md:text-2xl">Rs. {item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-secondary-container border-4 border-ink p-6 md:p-8 neo-shadow-lg lg:sticky lg:top-32">
              <h2 className="font-headline font-black text-2xl md:text-3xl uppercase mb-6 md:mb-8">ORDER SUMMARY</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-body text-lg">
                  <span className="text-ink/60">SUBTOTAL</span>
                  <span className="font-bold">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between font-body text-lg">
                  <span className="text-ink/60">SHIPPING</span>
                  <span className="font-bold">Rs. {shipping}</span>
                </div>
                <div className="flex justify-between font-body text-lg">
                  <span className="text-ink/60">TAX</span>
                  <span className="font-bold">Rs. 0.00</span>
                </div>
                <div className="pt-4 border-t-2 border-ink flex justify-between font-headline font-black text-2xl">
                  <span>TOTAL</span>
                  <span>Rs. {total}</span>
                </div>
              </div>

              <button
                onClick={() => setPage('checkout')}
                className="w-full bg-ink text-white py-4 md:py-5 font-headline font-black text-base md:text-xl border-4 border-ink neo-shadow hover:bg-tertiary transition-all active-press flex items-center justify-center gap-3"
              >
                CHECKOUT <ArrowRight size={24} />
              </button>
              
              <p className="mt-6 text-center font-label text-[10px] text-ink/40 uppercase tracking-widest">
                SECURE CHECKOUT POWERED BY VIKTHRIFTS PROTOCOL
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 md:py-32 border-4 border-dashed border-ink/20 bg-surface-container/30">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-ink neo-shadow mb-8">
            <ShoppingBag size={48} className="text-ink/20" />
          </div>
          <h2 className="font-headline font-black text-3xl md:text-4xl text-ink/30 uppercase mb-8">YOUR CART IS EMPTY</h2>
          <button 
            onClick={() => setPage('home')}
            className="w-full sm:w-auto bg-primary-container border-4 border-ink px-8 md:px-12 py-4 md:py-5 font-headline font-black text-base md:text-xl neo-shadow hover:neo-shadow-lg active-press transition-all"
          >
            START SHOPPING
          </button>
        </div>
      )}
    </div>
  );
};
