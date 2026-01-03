
import React, { useState } from 'react';
import { X, ExternalLink, Calendar, Trash2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Advertisement, Language } from '../types';
import { translations } from '../translations';

interface Props {
  ad: Advertisement | null;
  isOpen: boolean;
  onClose: () => void;
  onHideAd: (id: string) => void;
  lang: Language;
}

const AdSummaryModal: React.FC<Props> = ({ ad, isOpen, onClose, onHideAd, lang }) => {
  const t = translations[lang];
  const [isHiding, setIsHiding] = useState(false);

  if (!isOpen || !ad) return null;

  const handleHideClick = () => {
    setIsHiding(true);
    // 1.8초간 메시지 노출 후 부모의 onHideAd 호출 (모달 닫힘 및 데이터 처리)
    setTimeout(() => {
      onHideAd(ad.id);
      setIsHiding(false);
    }, 1800);
  };

  const eventDate = new Date(ad.date);
  const dateString = lang === 'ko' ? (
    <span className="font-lexend font-medium tracking-normal">
      {eventDate.getFullYear()} <span className="font-serif font-black text-[9px] opacity-40">년</span> {eventDate.getMonth() + 1} <span className="font-serif font-black text-[9px] opacity-40">월</span> {eventDate.getDate()} <span className="font-serif font-black text-[9px] opacity-40">일</span>
    </span>
  ) : (
    <span className="font-lexend font-medium tracking-normal">
      {eventDate.getMonth() + 1}-{eventDate.getDate()}-{eventDate.getFullYear()}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl transition-all duration-500 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-lime-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[440px] border rounded-[2.5rem] p-6 sm:p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] bg-[#0a0a0a] border-white/10 flex flex-col transform transition-all animate-in fade-in zoom-in duration-700 max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* Ad Hidden Feedback Toast (Overlay within Modal) */}
        {isHiding && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md rounded-[2.5rem] animate-in fade-in duration-300">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
              <CheckCircle size={18} className="text-lime-400 flex-shrink-0" />
              <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">{t.adHiddenFeedback}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative flex items-center justify-center w-full mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-lime-500">{t.sponsored}</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-white/40">{ad.provider}</span>
          </div>
          {!isHiding && (
            <button 
              onClick={onClose} 
              className="absolute right-0 p-1.5 rounded-full text-white/30 hover:text-white transition-all active:scale-90"
            >
              <X size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-white leading-tight tracking-tight px-4">
            {ad.title}
          </h2>
        </div>

        {/* Image / Visual */}
        <div className="relative group w-full aspect-[4/5] sm:aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/10 mb-8 bg-white/[0.01]">
          {ad.imageUrl ? (
            <>
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-white/10">
              <ImageIcon size={64} strokeWidth={1} />
              <span className="text-[11px] font-black tracking-[0.4em] uppercase">Visual Preview</span>
            </div>
          )}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md min-w-max z-10">
            <Calendar size={13} className="text-lime-400" />
            <span className="text-[11px] whitespace-nowrap">{dateString}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Not Interested Button */}
          <button 
            onClick={handleHideClick} 
            disabled={isHiding}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 text-white/30 font-bold text-[10px] tracking-[0.1em] hover:bg-white/5 hover:text-white transition-all active:scale-95 uppercase bg-white/[0.02] disabled:opacity-50"
          >
            <Trash2 size={13} /> {t.hideAd}
          </button>
          
          {/* Visit / Link Button */}
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-black text-[11px] tracking-[0.1em] hover:bg-opacity-90 active:scale-95 transition-all shadow-lg uppercase">
            {t.visitAd} <ExternalLink size={14} strokeWidth={2.5} />
          </a>
        </div>

        <p className="mt-8 text-[8px] font-bold text-white/10 tracking-[0.5em] uppercase text-center leading-relaxed">FRAGMENTS OF YOUR FUTURE JOURNEY</p>
      </div>
    </div>
  );
};

export default AdSummaryModal;
