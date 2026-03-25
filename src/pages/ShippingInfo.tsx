import React from 'react';
import { Page } from '../types';
import { Truck, Globe, Clock, AlertCircle } from 'lucide-react';

interface ShippingInfoProps {
  setPage: (page: Page) => void;
}

export const ShippingInfo: React.FC<ShippingInfoProps> = ({ setPage }) => {
  return (
    <div className="min-h-screen bg-surface py-16 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="font-headline font-black text-6xl tracking-tighter uppercase mb-6 text-center">SHIPPING INFO</h1>
      <p className="font-body text-xl text-ink/60 text-center max-w-2xl mx-auto mb-16">
        Global delivery for global collectors. We ensure your archival pieces arrive safely.
      </p>

      <div className="space-y-12">
        <section className="bg-white border-4 border-ink p-8 neo-shadow">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-primary-container border-4 border-ink flex-shrink-0 flex items-center justify-center">
              <Truck size={32} />
            </div>
            <div>
              <h3 className="font-headline font-black text-2xl uppercase mb-4">DOMESTIC SHIPPING</h3>
              <p className="font-body text-ink/80 mb-4">
                Standard shipping typically takes 3-5 business days within India. 
                Express shipping (1-2 business days) is available at checkout for eligible items.
              </p>
              <ul className="font-label font-bold text-sm space-y-2">
                <li className="flex justify-between border-b-2 border-ink/10 pb-2">
                  <span>STANDARD (3-5 DAYS)</span>
                  <span>Rs. 60.00</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>EXPRESS (1-2 DAYS)</span>
                  <span>Rs. 120.00</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white border-4 border-ink p-8 neo-shadow">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-secondary-container border-4 border-ink flex-shrink-0 flex items-center justify-center">
              <Globe size={32} />
            </div>
            <div>
              <h3 className="font-headline font-black text-2xl uppercase mb-4">INTERNATIONAL SHIPPING</h3>
              <p className="font-body text-ink/80 mb-4">
                We ship to over 100 countries worldwide. International orders may be subject to import duties and taxes, 
                which are the responsibility of the recipient.
              </p>
              <div className="bg-ink text-white p-4 font-label text-xs">
                ESTIMATED DELIVERY: 7-14 BUSINESS DAYS
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container border-4 border-ink p-6">
            <div className="flex items-center gap-3 mb-4 text-tertiary">
              <Clock size={24} />
              <h4 className="font-headline font-black text-xl uppercase">PROCESSING TIME</h4>
            </div>
            <p className="font-body text-sm">
              Please allow 1-2 business days for sellers to process and ship your order. 
              You will receive a tracking number via email once your package ships.
            </p>
          </div>

          <div className="bg-surface-container border-4 border-ink p-6">
            <div className="flex items-center gap-3 mb-4 text-tertiary">
              <AlertCircle size={24} />
              <h4 className="font-headline font-black text-xl uppercase">LOST PACKAGES</h4>
            </div>
            <p className="font-body text-sm">
              All shipments are insured. If your package is lost in transit, please contact 
              support immediately for a full investigation and refund.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
