import React from 'react';
import { Page } from '../types';
import { RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

interface ReturnsProps {
  setPage: (page: Page) => void;
}

export const Returns: React.FC<ReturnsProps> = ({ setPage }) => {
  return (
    <div className="min-h-screen bg-surface py-16 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="font-headline font-black text-6xl tracking-tighter uppercase mb-6">RETURNS & REFUNDS</h1>
        <p className="font-body text-xl text-ink/60 max-w-2xl mx-auto">
          Shop with confidence. Our buyer protection policy ensures you get exactly what you ordered.
        </p>
      </div>

      <div className="bg-white border-4 border-ink p-8 md:p-12 neo-shadow mb-12">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <div className="w-24 h-24 bg-tertiary text-white border-4 border-ink flex items-center justify-center flex-shrink-0 neo-shadow-sm rotate-3">
            <RefreshCcw size={40} />
          </div>
          <div>
            <h2 className="font-headline font-black text-3xl uppercase mb-4">THE VIKTHRIFTS GUARANTEE</h2>
            <p className="font-body text-lg leading-relaxed">
              If an item arrives significantly not as described, fake, or damaged, you are eligible for a full refund. 
              You have <strong>3 days</strong> after delivery to inspect your item and report any issues.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-ink p-6 bg-surface-container">
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <CheckCircle size={24} />
              <h3 className="font-headline font-black text-xl uppercase">COVERED</h3>
            </div>
            <ul className="space-y-3 font-body font-bold text-sm list-disc pl-5">
              <li>Item is not authentic (Fake)</li>
              <li>Wrong item sent</li>
              <li>Missing accessories mentioned in listing</li>
              <li>Significant damage not disclosed</li>
              <li>Wrong size label</li>
            </ul>
          </div>

          <div className="border-4 border-ink p-6 bg-surface-container">
            <div className="flex items-center gap-3 mb-4 text-tertiary">
              <XCircle size={24} />
              <h3 className="font-headline font-black text-xl uppercase">NOT COVERED</h3>
            </div>
            <ul className="space-y-3 font-body font-bold text-sm list-disc pl-5">
              <li>Item doesn't fit (check measurements!)</li>
              <li>Change of mind</li>
              <li>Minor wear consistent with condition rating</li>
              <li>Delayed shipping</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="font-headline font-black text-3xl uppercase text-center">HOW TO START A RETURN</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'REPORT ISSUE', desc: 'Go to your orders and click "Report Issue" within 3 days of delivery.' },
            { step: '02', title: 'UPLOAD PROOF', desc: 'Submit clear photos showing the damage or discrepancy.' },
            { step: '03', title: 'SHIP BACK', desc: 'If approved, you will receive a prepaid shipping label.' }
          ].map((item, i) => (
            <div key={i} className="bg-white border-4 border-ink p-6 neo-shadow text-center">
              <span className="font-headline font-black text-5xl text-ink/10 block mb-4">{item.step}</span>
              <h4 className="font-headline font-black text-xl uppercase mb-2">{item.title}</h4>
              <p className="font-body text-sm text-ink/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
