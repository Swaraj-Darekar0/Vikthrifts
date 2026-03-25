import React from 'react';
import { Page } from '../types';
import { Mail, MessageSquare, Instagram, Twitter } from 'lucide-react';

interface ContactUsProps {
  setPage: (page: Page) => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ setPage }) => {
  return (
    <div className="min-h-screen bg-surface py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left Side - Info */}
        <div className="w-full md:w-1/2">
          <h1 className="font-headline font-black text-6xl tracking-tighter uppercase mb-8">GET IN TOUCH</h1>
          <p className="font-body text-xl text-ink/70 mb-12">
            Have a question about an order, a collaboration, or just want to say hi? We're here for it.
          </p>

          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 bg-white border-4 border-ink neo-shadow">
              <div className="w-12 h-12 bg-primary-container border-2 border-ink flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg uppercase">EMAIL US</h3>
                <p className="font-label font-bold text-ink/60">support@VIKTHRIFTS.com</p>
              </div>
            </div>

            <div className="flex items-center gap-6 p-6 bg-white border-4 border-ink neo-shadow">
              <div className="w-12 h-12 bg-secondary-container border-2 border-ink flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg uppercase">LIVE CHAT</h3>
                <p className="font-label font-bold text-ink/60">Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="font-headline font-black text-xl uppercase mb-4">FOLLOW US</h3>
            <div className="flex gap-4">
              <button className="p-4 bg-ink text-white hover:bg-tertiary transition-colors border-4 border-ink neo-shadow">
                <Instagram size={24} />
              </button>
              <button className="p-4 bg-ink text-white hover:bg-tertiary transition-colors border-4 border-ink neo-shadow">
                <Twitter size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2">
          <form className="bg-white border-4 border-ink p-8 neo-shadow-lg space-y-6">
            <h2 className="font-headline font-black text-3xl uppercase mb-6">SEND A MESSAGE</h2>
            
            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">NAME</label>
              <input 
                type="text" 
                className="w-full bg-surface-container border-4 border-ink p-3 font-bold focus:bg-white outline-none transition-colors"
                placeholder="YOUR NAME"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">EMAIL</label>
              <input 
                type="email" 
                className="w-full bg-surface-container border-4 border-ink p-3 font-bold focus:bg-white outline-none transition-colors"
                placeholder="YOUR@EMAIL.COM"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">TOPIC</label>
              <select className="w-full bg-surface-container border-4 border-ink p-3 font-bold focus:bg-white outline-none transition-colors">
                <option>Order Issue</option>
                <option>General Inquiry</option>
                <option>Seller Support</option>
                <option>Press / Collabs</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-label font-bold text-xs uppercase tracking-widest">MESSAGE</label>
              <textarea 
                rows={5}
                className="w-full bg-surface-container border-4 border-ink p-3 font-bold focus:bg-white outline-none transition-colors resize-none"
                placeholder="HOW CAN WE HELP?"
              ></textarea>
            </div>

            <button className="w-full bg-primary-container border-4 border-ink py-4 font-headline font-black text-xl neo-shadow hover:neo-shadow-lg active-press transition-all">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
