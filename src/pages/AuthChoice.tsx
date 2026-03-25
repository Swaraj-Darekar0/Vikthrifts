import React from 'react';
import { Page } from '../types';
import { ArrowLeft, ShoppingBag, Store, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthChoiceProps {
  setPage: (page: Page) => void;
}

export const AuthChoice: React.FC<AuthChoiceProps> = ({ setPage }) => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface flex flex-col">
      <div className="p-5 sm:p-8 md:p-12">
        <button 
          onClick={() => setPage('home')}
          className="flex items-center gap-2 font-label font-bold text-sm hover:text-tertiary transition-colors"
        >
          <ArrowLeft size={16} /> BACK TO HOME
        </button>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row border-t-4 border-ink">
        {/* Buyer Option */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setPage('auth-buyer')}
          className="flex-1 p-8 sm:p-10 md:p-24 flex flex-col justify-center items-center text-center cursor-pointer group hover:bg-primary-container transition-colors border-b-4 lg:border-b-0 lg:border-r-4 border-ink"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-ink flex items-center justify-center mb-6 md:mb-8 neo-shadow group-hover:neo-shadow-lg transition-all rotate-[-3deg]">
            <ShoppingBag size={48} />
          </div>
          <h2 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase mb-4 md:mb-6">BUYER</h2>
          <p className="font-body text-base md:text-xl text-ink/60 max-w-sm mb-8 md:mb-12">
            Access exclusive drops, archival pieces, and connect with global collectors.
          </p>
          <div className="flex items-center gap-3 font-headline font-black text-lg md:text-2xl group-hover:translate-x-2 transition-transform">
            JOIN THE COLLECTIVE <ArrowRight size={32} />
          </div>
        </motion.div>

        {/* Seller Option */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setPage('auth-seller')}
          className="flex-1 p-8 sm:p-10 md:p-24 flex flex-col justify-center items-center text-center cursor-pointer group hover:bg-secondary-container transition-colors"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-ink flex items-center justify-center mb-6 md:mb-8 neo-shadow group-hover:neo-shadow-lg transition-all rotate-[3deg]">
            <Store size={48} />
          </div>
          <h2 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase mb-4 md:mb-6">SELLER</h2>
          <p className="font-body text-base md:text-xl text-ink/60 max-w-sm mb-8 md:mb-12">
            Launch your store, reach global collectors, and build your archive brand.
          </p>
          <div className="flex items-center gap-3 font-headline font-black text-lg md:text-2xl group-hover:translate-x-2 transition-transform">
            START SELLING <ArrowRight size={32} />
          </div>
        </motion.div>
      </div>

      {/* Marquee-like footer */}

    </div>
  );
};
