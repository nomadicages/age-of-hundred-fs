
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Save, Calendar, Clock, ChevronRight } from 'lucide-react';
import CalendarLayer from './CalendarLayer';
import { Language } from '../types';
import { translations } from '../translations';

interface WheelPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: any) => void;
  itemHeight?: number;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange, itemHeight = 40 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    if (scrollRef.current && !isScrollingRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        const targetScroll = index * itemHeight;
        if (Math.abs(scrollRef.current.scrollTop - targetScroll) > 1) {
          scrollRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  }, [value, options, itemHeight]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;
    const index = Math.round(scrollRef.current.scrollTop / itemHeight);
    const newValue = options[index];
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTime.current < 150) return;
    lastWheelTime.current = now;
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = options.indexOf(value);
    const nextIndex = Math.max(0, Math.min(options.length - 1, currentIndex + direction));
    if (nextIndex !== currentIndex) onChange(options[nextIndex]);
  };

  return (
    <div className="relative w-full flex flex-col items-center overflow-hidden group" style={{ height: itemHeight * 3 }}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 transition-colors border-y border-white/20 bg-white/5 pointer-events-none" style={{ height: itemHeight }} />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onScrollEnd={() => (isScrollingRef.current = false)}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative z-10"
        style={{ padding: `${itemHeight}px 0` }}
      >
        {options.map((option, i) => (
          <div key={i} className={`flex items-center justify-center snap-center text-sm sm:text-base font-semibold font-lexend tabular-nums transition-all duration-300 text-white ${option === value ? 'opacity-100 scale-125' : 'opacity-85 scale-90 blur-[0.1px]'}`} style={{ height: itemHeight, scrollSnapStop: 'always', scrollSnapAlign: 'center' }}>
            {option}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-black/80 via-transparent to-black/80 opacity-90" />
    </div>
  );
};

interface Props {
  onComplete: (date: Date) => void;
  initialDate?: Date;
  isEditing?: boolean;
  lang: Language;
}

const BirthInput: React.FC<Props> = ({ onComplete, initialDate, isEditing, lang }) => {
  const t = translations[lang];
  const [now] = useState(() => new Date()); 
  const [year, setYear] = useState(initialDate?.getFullYear() || now.getFullYear());
  const [month, setMonth] = useState(initialDate ? initialDate.getMonth() + 1 : now.getMonth() + 1);
  const [day, setDay] = useState(initialDate?.getDate() || now.getDate());
  const initialHour = initialDate?.getHours() || 12;
  const [hour, setHour] = useState(initialHour % 12 === 0 ? 12 : initialHour % 12);
  const [minute, setMinute] = useState(initialDate?.getMinutes() || 0);
  const [period, setPeriod] = useState(initialHour >= 12 ? t.pm : t.am);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setPeriod(prev => prev === translations.ko.pm || prev === translations.en.pm ? t.pm : t.am);
  }, [lang, t.am, t.pm]);

  const years = Array.from({ length: 120 }, (_, i) => now.getFullYear() - i);
   // 1. 가용 월 계산: 현재 연도라면 이번 달까지만
   const availableMonths = useMemo(() => {
    const isCurrentYear = year === now.getFullYear();
    const maxMonth = isCurrentYear ? now.getMonth() + 1 : 12;
    return Array.from({ length: maxMonth }, (_, i) => i + 1);
  }, [year, now.getFullYear()]);

  // 2. 가용 일 계산: 현재 연도/월이라면 오늘 일자까지만
  const availableDays = useMemo(() => {
    const isCurrentYear = year === now.getFullYear();
    const isCurrentMonth = isCurrentYear && month === (now.getMonth() + 1);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const maxDay = isCurrentMonth ? now.getDate() : lastDayOfMonth;
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [year, month, now.getFullYear(), now.getDate()]);

  // 3. 미래 선택 방지를 위한 자동 보정 로직
  useEffect(() => {
    // 연도를 현재로 바꿨을 때 선택된 월이 미래라면 현재 월로 보정
    if (year === now.getFullYear() && month > now.getMonth() + 1) {
      setMonth(now.getMonth() + 1);
    }
  }, [year]);

  useEffect(() => {
    // 월을 바꿨을 때 선택된 일이 가용 범위를 벗어나면 마지막 일자로 보정
    const maxDay = availableDays[availableDays.length - 1];
    if (day > maxDay) {
      setDay(maxDay);
    }
  }, [year, month, availableDays]);



  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalHour = period === t.pm ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const date = new Date(year, month - 1, day, finalHour, minute);
    onComplete(date);
  };

  const pickerItemHeight = window.innerWidth < 640 ? 40 : 44;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* BIRTHDATE Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold flex items-center gap-1.5 text-white uppercase tracking-[0.2em]">
              <Calendar size={12} /> {t.birthdate}
            </label>
            <button type="button" onClick={() => setIsCalendarOpen(true)} className="p-1.5 rounded-lg border transition-all hover:bg-white/10 border-white/10">
              <Calendar size={13} className="text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-0 p-0.5 border rounded-[1.25rem] bg-black/40 border-white/20 overflow-hidden">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">YEAR</span>
              <WheelPicker options={years} value={year} onChange={setYear} itemHeight={pickerItemHeight} />
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">MONTH</span>
              <WheelPicker options={availableMonths} value={month} onChange={setMonth} itemHeight={pickerItemHeight} />

            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">DAY</span>
              <WheelPicker options={availableDays} value={day} onChange={setDay} itemHeight={pickerItemHeight} />
            </div>
          </div>
        </div>

        {/* BIRTH TIME Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold ml-1 flex items-center gap-1.5 text-white uppercase tracking-[0.2em]">
            <Clock size={12} /> {t.birthTime}
          </label>
          <div className="grid grid-cols-3 gap-0 p-0.5 border rounded-[1.25rem] bg-black/40 border-white/20 overflow-hidden">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">HR</span>
              <WheelPicker options={hoursList} value={hour} onChange={setHour} itemHeight={pickerItemHeight} />
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">MIN</span>
              <WheelPicker options={minutesList.map(m => m.toString().padStart(2, '0'))} value={minute.toString().padStart(2, '0')} onChange={(val) => setMinute(parseInt(val))} itemHeight={pickerItemHeight} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-white/90 mt-3 uppercase tracking-widest">AM/PM</span>
              <WheelPicker options={[t.am, t.pm]} value={period} onChange={setPeriod} itemHeight={pickerItemHeight} />
            </div>
          </div>
        </div>

        {/* Submit Button - font is medium (not bold), box length increased, font size +2 */}
        <button type="submit" className="w-full font-medium py-5 sm:py-7 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-300 to-lime-500 text-black hover:opacity-90 active:scale-95 mt-8 shadow-lg shadow-lime-500/10">
          <span className="text-xl sm:text-2xl lg:text-3xl uppercase tracking-[0.1em] font-medium">
            {isEditing ? t.save : t.start}
          </span> 
          {isEditing ? (
            <Save size={20} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={24} strokeWidth={2.5} />
          )}
        </button>
      </form>
      <CalendarLayer isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={{ year, month, day }} onSelect={(y, m, d) => { setYear(y); setMonth(m); setDay(d); }} lang={lang} disableFuture={true} disablePast={false}      />
    </>
  );
};

export default BirthInput;
