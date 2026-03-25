import React from 'react';
import { Page } from '../types';
import { ShoppingBag, Store, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import authBannerBg from '../../images/rename.png';

interface AuthChoiceProps {
  setPage: (page: Page) => void;
  overlay?: boolean;
}

export const AuthChoice: React.FC<AuthChoiceProps> = ({ setPage, overlay = false }) => {
  return (
    <div className={`${overlay ? 'w-full max-w-5xl bg-surface border-4 border-ink neo-shadow-lg overflow-hidden' : 'min-h-[calc(100vh-80px)] bg-surface'} flex flex-col`}>
      {!overlay && (
        <div
          className="relative min-h-[10rem] sm:min-h-[12rem] md:min-h-[14rem] border-y-4 border-ink bg-cover bg-center"
          style={{ backgroundImage: `url(${authBannerBg})` }}
        >
          {/* <div className="absolute inset-0 bg-white/55" /> */}
          {/* <button 
            onClick={() => setPage('home')}
            className="relative z-10 m-5 sm:m-8 md:m-12 flex items-center gap-2 font-label font-bold text-sm hover:text-tertiary transition-colors"
          >
            <ArrowLeft size={16} /> BACK TO HOME
          </button> */}
        </div>
      )}

      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Buyer Option */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setPage('auth-buyer')}
          className={`flex-1 p-8 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center items-center text-center cursor-pointer group transition-colors duration-300 border-ink hover:bg-[#a37343] ${overlay ? 'min-h-[18rem] lg:min-h-[24rem] border-b-4 lg:border-b-0 lg:border-r-4' : 'border-b-4 lg:border-b-0 lg:border-r-4'}`}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-ink flex items-center justify-center mb-6 md:mb-8 neo-shadow group-hover:bg-[#f0eddc] group-hover:neo-shadow-lg transition-all rotate-[-3deg]">
            <ShoppingBag size={48} />
          </div>
          <h2 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase mb-4 md:mb-6 group-hover:text-white transition-colors">BUYER</h2>
          <p className="font-body text-base md:text-xl text-ink/60 max-w-sm mb-8 md:mb-12 group-hover:text-white/85 transition-colors">
            Access exclusive drops, archival pieces, and connect with global collectors.
          </p>
          <div className="flex items-center gap-3 font-headline font-black text-lg md:text-2xl group-hover:translate-x-2 group-hover:text-white transition-all">
            JOIN THE COLLECTIVE <ArrowRight size={32} />
          </div>
        </motion.div>

        {/* Seller Option */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setPage('auth-seller')}
          className={`flex-1 p-8 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center items-center text-center cursor-pointer group transition-colors duration-300 hover:bg-[#cbc0b2] ${overlay ? 'min-h-[18rem] lg:min-h-[24rem]' : ''}`}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-ink flex items-center justify-center mb-6 md:mb-8 neo-shadow group-hover:bg-[#ece7d3] group-hover:neo-shadow-lg transition-all rotate-[3deg]">
            <Store size={48} />
          </div>
          <h2 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase mb-4 md:mb-6 group-hover:text-white transition-colors">SELLER</h2>
          <p className="font-body text-base md:text-xl text-ink/60 max-w-sm mb-8 md:mb-12 group-hover:text-white/85 transition-colors">
            Launch your store, reach global collectors, and build your archive brand.
          </p>
          <div className="flex items-center gap-3 font-headline font-black text-lg md:text-2xl group-hover:translate-x-2 group-hover:text-white transition-all">
            START SELLING <ArrowRight size={32} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
