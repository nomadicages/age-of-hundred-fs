
import React from 'react';
import { X, Check, Star, Shield, Layout, Zap, Crown, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onToggle: () => void;
  lang: Language;
}

const PremiumPage: React.FC<Props> = ({ isOpen, onClose, isPremium, onToggle, lang }) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const benefits = [
    { icon: <Shield size={18} className="text-yellow-500" />, text: t.premiumRemoveAds },
    { icon: <Sparkles size={18} className="text-blue-500" />, text: t.premiumInsightsAI },
    { icon: <Layout size={18} className="text-purple-500" />, text: t.premiumThemes },
    { icon: <Zap size={18} className="text-green-500" />, text: t.premiumPerformance },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black transition-all duration-700 overflow-y-auto no-scrollbar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-500/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative w-full max-w-lg px-5 py-8 sm:py-12 flex flex-col items-center min-h-screen sm:min-h-0 justify-center animate-in fade-in slide-in-from-bottom-5 duration-700">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all z-10">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Star size={16} className={`${isPremium ? 'text-blue-400 fill-blue-400' : 'text-yellow-500 fill-yellow-500'}`} />
          <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isPremium ? 'text-blue-400' : 'text-yellow-500'}`}>
            {isPremium ? t.premiumActiveStatus : t.premiumLimitedStatus}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-black text-white text-center mb-3 sm:mb-4 tracking-tight leading-tight">
          {isPremium ? t.premiumProTitle : t.premiumTitle}
        </h1>
        
        <p className="text-sm sm:text-lg text-white/40 text-center mb-8 sm:mb-12 max-w-[280px] sm:max-w-md font-medium leading-relaxed">
          {isPremium ? t.premiumSuccessDesc : t.premiumDesc}
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-3 w-full mb-8">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-4 p-4 sm:p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl hover:border-white/10 transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                {isPremium ? <Check size={18} className="text-blue-400" /> : benefit.icon}
              </div>
              <span className={`text-xs sm:text-base font-bold leading-snug ${isPremium ? 'text-white' : 'text-white/70'}`}>
                {benefit.text}
              </span>
            </div>
          ))}
        </div>

        {/* Purchase/Downgrade Button */}
        <div className="w-full max-w-sm flex flex-col items-center">
          {!isPremium && (
            <div className="text-xl sm:text-2xl font-medium font-lexend text-white mb-6 tracking-tighter tabular-nums">
              {t.premiumPrice}
            </div>
          )}
          
          <button 
            onClick={onToggle}
            className={`w-full py-4 sm:py-5 rounded-[1.75rem] sm:rounded-[2.5rem] font-black text-base sm:text-lg tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isPremium ? 'bg-white/10 text-white border border-white/20' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'}`}
          >
            {isPremium ? t.premiumDowngrade : t.premiumJoin}
            {!isPremium && <Crown size={20} fill="currentColor" />}
          </button>
          
          <p className="mt-6 text-[9px] font-bold text-white/20 tracking-widest uppercase text-center leading-relaxed whitespace-pre-line">
            {isPremium ? t.premiumStatusActive : t.premiumFooter}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
