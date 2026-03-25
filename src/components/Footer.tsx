import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { Page } from '../types';

interface FooterProps {
  setPage?: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ setPage }) => {
  const socialLinks = [
    {
      href: 'https://www.instagram.com/thrift_byvik?igsh=MW91bGpnMmU4ZDFocw%3D%3D&utm_source=qr',
      label: 'Instagram',
      Icon: Instagram,
    },
    {
      href: 'mailto:vickybarawl1@gmail.com',
      label: 'Email',
      Icon: Mail,
    },
  ];

  const handleNav = (e: React.MouseEvent, page: Page) => {
    e.preventDefault();
    if (setPage) setPage(page);
  };

  return (
    <footer className="bg-ink text-white border-t-4 border-ink pt-12 md:pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
        <div className="col-span-1 md:col-span-2">
          <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tighter mb-5 md:mb-6 text-primary-container">VIKTHRIFTS</h2>
          <p className="font-body text-base md:text-lg text-white/70 max-w-md mb-6 md:mb-8">
            From timeless fashion. Just character, quality, and history in every fit.
            you just wear it your way..
          </p>
          <div className="flex gap-4">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="p-3 border-2 border-white/20 hover:border-primary-container hover:text-primary-container transition-all"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-label font-bold text-sm mb-6 uppercase tracking-widest text-primary-container">MARKETPLACE</h4>
          <ul className="space-y-4 font-body text-white/60">
            <li><button onClick={(e) => handleNav(e, 'stores')} className="hover:text-white transition-colors text-left">All Stores</button></li>
            <li><button onClick={(e) => handleNav(e, 'home')} className="hover:text-white transition-colors text-left">New Arrivals</button></li>
            <li><button className="hover:text-white transition-colors text-left opacity-50 cursor-not-allowed">Archive Pieces</button></li>
            <li><button onClick={(e) => handleNav(e, 'auth-seller')} className="hover:text-white transition-colors text-left">Sell on VIKTHRIFTS</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label font-bold text-sm mb-6 uppercase tracking-widest text-primary-container">SUPPORT</h4>
          <ul className="space-y-4 font-body text-white/60">
            <li><button onClick={(e) => handleNav(e, 'help-center')} className="hover:text-white transition-colors text-left">Help Center</button></li>
            <li><button onClick={(e) => handleNav(e, 'shipping')} className="hover:text-white transition-colors text-left">Shipping Info</button></li>
            <li><button onClick={(e) => handleNav(e, 'returns')} className="hover:text-white transition-colors text-left">Returns</button></li>
            <li><button onClick={(e) => handleNav(e, 'contact')} className="hover:text-white transition-colors text-left">Contact Us</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs md:text-sm font-label text-white/40">
        <p className="text-left">© 2026 VIKTHRIFTS MARKETPLACE. ALL RIGHTS RESERVED.</p>
        <div className="flex flex-wrap gap-4 md:gap-8">
          <a href="#" className="hover:text-white">PRIVACY POLICY</a>
          <a href="#" className="hover:text-white">TERMS OF SERVICE</a>
          <button onClick={(e) => handleNav(e, 'admin-auth')} className="hover:text-white opacity-20">ADMIN</button>
        </div>
      </div>
    </footer>
  );
};
