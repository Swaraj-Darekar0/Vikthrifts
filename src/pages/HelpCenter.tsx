import React from 'react';
import { Page } from '../types';
import { Search, HelpCircle, ChevronRight, FileText } from 'lucide-react';

interface HelpCenterProps {
  setPage: (page: Page) => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ setPage }) => {
  return (
    <div className="min-h-screen bg-surface py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="font-headline font-black text-6xl tracking-tighter uppercase mb-6">HELP CENTER</h1>
        <p className="font-body text-xl text-ink/60 max-w-2xl mx-auto mb-10">
          Everything you need to know about buying, selling, and collecting on VIKTHRIFTS.
        </p>
        
        <div className="max-w-2xl mx-auto relative flex items-center bg-white border-4 border-ink p-4 neo-shadow">
          <Search size={24} className="text-ink/30 ml-2" />
          <input 
            type="text" 
            placeholder="HOW CAN WE HELP?" 
            className="w-full bg-transparent border-none outline-none px-4 font-headline font-bold text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white border-4 border-ink p-8 neo-shadow hover:neo-shadow-lg transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-primary-container border-4 border-ink flex items-center justify-center mb-6">
            <HelpCircle size={24} />
          </div>
          <h3 className="font-headline font-black text-2xl uppercase mb-4 group-hover:text-primary-container transition-colors">BUYING GUIDE</h3>
          <ul className="space-y-3 font-body text-ink/70">
            <li className="flex items-center gap-2"><ChevronRight size={16} /> How to place an order</li>
            <li className="flex items-center gap-2"><ChevronRight size={16} /> Payment methods</li>
            <li className="flex items-center gap-2"><ChevronRight size={16} /> Authenticity guarantee</li>
          </ul>
        </div>

        <div className="bg-white border-4 border-ink p-8 neo-shadow hover:neo-shadow-lg transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-secondary-container border-4 border-ink flex items-center justify-center mb-6">
            <FileText size={24} />
          </div>
          <h3 className="font-headline font-black text-2xl uppercase mb-4 group-hover:text-secondary-container transition-colors">SELLING GUIDE</h3>
          <ul className="space-y-3 font-body text-ink/70">
            <li className="flex items-center gap-2"><ChevronRight size={16} /> Seller guidelines</li>
            <li className="flex items-center gap-2"><ChevronRight size={16} /> Commission fees</li>
            <li className="flex items-center gap-2"><ChevronRight size={16} /> Shipping your items</li>
          </ul>
        </div>
      </div>

      <div className="border-t-4 border-ink pt-12">
        <h2 className="font-headline font-black text-3xl uppercase mb-8">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="space-y-4">
          {[
            "Is VIKTHRIFTS legitimate?",
            "How long does shipping take?",
            "Can I cancel my order?",
            "How do I become a verified seller?"
          ].map((faq, i) => (
            <div key={i} className="bg-surface-container border-2 border-ink p-6 flex justify-between items-center hover:bg-white cursor-pointer transition-colors">
              <span className="font-headline font-bold text-lg">{faq}</span>
              <ChevronRight />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
