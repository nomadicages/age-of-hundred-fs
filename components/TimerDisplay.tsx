
import React from 'react';
import { TimeUnit, LifeProgress, Language } from '../types';
import { translations } from '../translations';

interface Props {
  progress: LifeProgress | null;
  unit: TimeUnit;
  lang: Language;
  direction?: 'left' | 'right';
}

const TimerDisplay: React.FC<Props> = ({ progress, unit, lang, direction = 'right' }) => {
  if (!progress) return null;
  const t = translations[lang];
  
  const getValue = () => {
    switch (unit) {
      case 'years': return progress.yearsRemaining;
      case 'months': return progress.monthsRemaining;
      case 'days': return progress.daysRemaining;
      case 'hours': return progress.hoursRemaining;
      case 'minutes': return progress.minutesRemaining;
      case 'seconds': return progress.secondsRemaining;
      default: return 0;
    }
  };

  const value = getValue();
  const integerPart = Math.floor(value).toLocaleString();
  const decimalPrecision = unit === 'seconds' || unit === 'minutes' ? 3 : 7;
  const decimalPart = (value % 1).toFixed(decimalPrecision).substring(2);

  // Determine responsive font size classes based on integer length
  const getIntegerClasses = () => {
    const len = integerPart.length;
    if (len > 12) {
      return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl";
    } else if (len > 9) {
      return "text-5xl sm:text-6xl md:text-7xl lg:text-8xl";
    } else if (len > 7) {
      return "text-6xl sm:text-7xl md:text-8xl lg:text-9xl";
    } else {
      return "text-7xl sm:text-8xl md:text-9xl lg:text-[11rem]";
    }
  };

  const animationClass = direction === 'right' ? 'animate-slide-right' : 'animate-slide-left';

  return (
    <div key={unit} className={`flex flex-col items-center w-full px-4 sm:px-8 overflow-hidden py-6 md:py-12 ${animationClass}`}>
      <div className="flex flex-col items-center w-full justify-center text-center">
        
        {/* Integer Part - Uses Tailwind responsive classes instead of clamp() */}
        <span 
          className={`
            font-lexend font-semibold tracking-tighter tabular-nums drop-shadow-2xl text-white 
            transition-all duration-500 max-w-full break-all leading-[1.0]
            ${getIntegerClasses()}
          `}
        >
          {integerPart}
        </span>

        {/* Decimal Part - Responsive sizing with Tailwind */}
        <div className="mt-4 sm:mt-6 md:mt-8 flex items-baseline"> 
          <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-lexend font-semibold tabular-nums opacity-40 text-white tracking-widest">
            .{decimalPart}
          </span>
        </div>

        {/* Unit Label - Large aesthetic background label using responsive Tailwind */}
        <div className="mt-2 sm:mt-4">
          <span className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-[0.2em] sm:tracking-[0.4em] text-white/10 uppercase font-serif leading-none select-none">
            {t.timerLabels[unit]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
