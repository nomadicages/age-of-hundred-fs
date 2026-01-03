
import React from 'react';
import { Advertisement, Language } from '../types';
import { translations } from '../translations';

interface Props {ad: Advertisement;
  lang: Language;
  onClick: (ad: Advertisement) => void;
  getRemainingTimeStr: (date: string) => React.ReactNode;
}

const AdSlot: React.FC<Props> = ({ ad, lang, onClick }) => {
  const t = translations[lang];
  return (
    <div 
      id={`native-ad-container-${ad.id}`}
      onClick={() => onClick(ad)}
      className="native-ad-placeholder flex-shrink-0 w-44 sm:w-60 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/20 bg-white/5 relative overflow-hidden flex flex-col justify-between transition-all hover:border-white/40 cursor-pointer"
    >
      {/* 상단: 배지 및 광고주 정보 */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/50">
          AD
        </span>
        <span className="text-[8px] sm:text-[9px] font-medium text-white/20 truncate max-w-[100px]">
          {ad.advertiser || 'Sponsored'}
        </span>
      </div>

      {/* 중단: 광고 본문 (이미지 + 텍스트) */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {(ad.images && ad.images.length > 0) || ad.imageUrl ? (
          <div className="w-full h-20 sm:h-24 mb-2 rounded-xl overflow-hidden bg-white/5">
            <img 
              src={ad.images?.[0] || ad.imageUrl} 
              alt="Ad Media" 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ) : null}
        
        <p className="text-sm sm:text-base font-black text-white truncate mb-1">
          {ad.headline || ad.title}
        </p>
        <p className="text-[10px] sm:text-[11px] text-white/40 line-clamp-2 leading-tight">
          {ad.body || ''}
        </p>
      </div>

      {/* 하단: 행동 유도 버튼 (CTA) */}
      <div className="mt-3">
        <div className="w-full py-2 rounded-xl bg-lime-400/20 border border-lime-400/30 text-center">
          <span className="text-[11px] sm:text-xs font-black text-lime-400">
            {ad.callToAction || t.learnMore}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
