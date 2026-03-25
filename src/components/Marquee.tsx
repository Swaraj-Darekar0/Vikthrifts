import React from 'react';

interface MarqueeProps {
  text: string;
  bg?: string;
  reverse?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({ text, bg = 'bg-ink', reverse = false }) => {
  const items = Array(10).fill(text);
  
  return (
    <div className={`${bg} border-y-4 border-ink overflow-hidden py-3 flex whitespace-nowrap`}>
      <div className={`flex items-center gap-8 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {items.map((item, i) => (
          <span key={i} className={`font-headline font-black text-2xl uppercase ${bg === 'bg-ink' ? 'text-white' : 'text-ink'}`}>
            {item} <span className="mx-4 text-primary-container">✦</span>
          </span>
        ))}
        {items.map((item, i) => (
          <span key={`dup-${i}`} className={`font-headline font-black text-2xl uppercase ${bg === 'bg-ink' ? 'text-white' : 'text-ink'}`}>
            {item} <span className="mx-4 text-primary-container">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};
