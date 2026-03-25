import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { Page } from '../types';

interface NavbarProps {
  setPage: (page: Page) => void;
  cartCount: number;
  user: any;
  isSeller: boolean;
  onSearch: (query: string) => void;
  isHome?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ setPage, cartCount, user, isSeller, onSearch, isHome }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we've scrolled past the top
      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Determine visibility based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up or at top
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [isHome, user, isSeller]);

  // Navbar dynamic classes
  const getNavbarClasses = () => {
    const baseClasses = "z-50 transition-all duration-300 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between w-full ";
    
    // Transparent only at the very top of the home page
    const isTransparent = isHome && !isScrolled;
    
    if (isTransparent) {
      return baseClasses + "absolute top-0 left-0 bg-transparent border-b-4 border-transparent text-white";
    } else {
      // White background, fixed, and hidden on scroll down / shown on scroll up
      return baseClasses + `fixed top-0 left-0 bg-white border-b-4 border-ink shadow-sm text-ink transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`;
    }
  };

  return (
    <nav className={getNavbarClasses()}>
      <div className="flex items-center gap-3 md:gap-8 min-w-0">
        <button 
          onClick={() => setPage('home')}
          className="md:hidden font-headline font-black text-2xl tracking-tighter cursor-pointer hover:text-primary-container transition-colors truncate"
        >
          VIKTHRIFTS
        </button>
        
        <div className="hidden md:flex items-center gap-6 font-label text-sm font-bold">
          <button onClick={() => setPage('stores')} className="hover:underline cursor-pointer">STORES</button>
        </div>
      </div>
      <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={() => setPage('home')}
          className="font-headline font-black text-3xl tracking-tighter cursor-pointer hover:text-primary-container transition-colors"
        >
          VIKTHRIFTS
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden lg:flex items-center bg-white border-2 border-ink px-3 py-1.5 neo-shadow-sm">
          <Search size={18} className="text-ink/50" />
          <input 
            type="text" 
            placeholder="SEARCH ARCHIVE..." 
            className="bg-transparent border-none outline-none px-2 font-label text-xs w-48"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Dynamic Sell/Dashboard Button */}
          <button 
            onClick={() => isSeller ? setPage('seller-dashboard') : setPage('auth-seller')}
            className={`hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 border-2 border-ink neo-shadow-sm font-label font-bold text-[11px] md:text-xs hover:bg-white active-press transition-colors ${isSeller ? 'bg-primary-container' : 'bg-secondary-container'}`}
          >
            {isSeller ? 'DASHBOARD' : 'SELL'}
          </button>

          <button 
            onClick={() => user ? setPage('profile') : setPage('auth-choice')}
            className={`p-2 border-2 border-ink neo-shadow-sm hover:bg-secondary-container active-press transition-colors ${user ? 'bg-secondary-container' : 'bg-white'}`}
          >
            <User size={20} />
          </button>
          <button 
            onClick={() => setPage('cart')}
            className="p-2 border-2 border-ink neo-shadow-sm bg-primary-container hover:opacity-80 active-press transition-colors relative"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-tertiary text-white text-[10px] font-bold px-1.5 py-0.5 border-2 border-ink rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 border-2 border-ink neo-shadow-sm bg-white active-press"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-white text-ink border-b-4 border-ink px-4 pb-4 shadow-sm">
          <div className="flex items-center bg-surface border-2 border-ink px-3 py-2 neo-shadow-sm mt-1">
            <Search size={16} className="text-ink/50" />
            <input
              type="text"
              placeholder="SEARCH ARCHIVE..."
              className="w-full bg-transparent border-none outline-none px-2 font-label text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch((e.target as HTMLInputElement).value);
                  setMobileMenuOpen(false);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            <button
              onClick={() => {
                setPage('stores');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 border-2 border-ink bg-white font-label font-bold text-xs uppercase tracking-widest"
            >
              Stores
            </button>
            <button
              onClick={() => {
                isSeller ? setPage('seller-dashboard') : setPage('auth-seller');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 border-2 border-ink font-label font-bold text-xs uppercase tracking-widest ${isSeller ? 'bg-primary-container' : 'bg-secondary-container'}`}
            >
              {isSeller ? 'Dashboard' : 'Sell On VIKTHRIFTS'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
