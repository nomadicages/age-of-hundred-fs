import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Volume2, VolumeX, Play, Square } from 'lucide-react';
import CalendarLayer from './CalendarLayer';
import { Language, Anniversary } from '../types';
import { translations } from '../translations';
import { ALARM_SOUNDS, playAlarmSound, stopAlarmSound } from '../audioEngine';

interface WheelPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: any) => void;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemHeight = 44;

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
  }, [value, options]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const index = Math.round(scrollRef.current.scrollTop / itemHeight);
    const newValue = options[index];
    if (newValue !== undefined && newValue !== value) onChange(newValue);

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 200);
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

  const lastWheelTime = useRef(0);

  return (
    <div className="relative w-full flex flex-col items-center overflow-hidden group" style={{ height: itemHeight * 3 }}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 transition-colors border-y border-white/20 bg-white/5 pointer-events-none" style={{ height: itemHeight }} />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative z-10"
        style={{ padding: `${itemHeight}px 0` }}
      >
        {options.map((option, i) => (
          <div key={i} className={`flex items-center justify-center snap-center text-sm sm:text-base font-semibold font-lexend tabular-nums transition-all duration-300 text-white ${option === value ? 'opacity-100 scale-125' : 'opacity-85 scale-90 blur-[0.1px]'}`} style={{ height: itemHeight, scrollSnapStop: 'always', scrollSnapAlign: 'center' }}>
            {option}
          </div>
        ))}
      </div>
      
      {/* [수정] 오버레이 영역에 rounded-[inherit]를 추가하여 부모의 라운드 값을 상속받게 함 */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-black/80 via-transparent to-black/80 opacity-90 rounded-[inherit]" />
    </div>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, date: string, alarmEnabled: boolean, id?: string, soundId?: string) => void;
  initialData?: Anniversary | null;
  lang: Language;
}

const AnniversaryModal: React.FC<Props> = ({ isOpen, onClose, onAdd, initialData, lang }) => {
  const t = translations[lang];
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'date' | 'duration'>('date');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmSoundId, setAlarmSoundId] = useState<string>(ALARM_SOUNDS[0].id);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  
  const [now] = useState(() => new Date());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());
  const [durMonths, setDurMonths] = useState('0');
  const [durDays, setDurDays] = useState('0');

  // D-day 가용 범위 계산
  const availableYears = useMemo(() => Array.from({ length: 101 }, (_, i) => now.getFullYear() + i), [now]);
  const availableMonths = useMemo(() => {
    const isCurrentYear = year === now.getFullYear();
    const minMonth = isCurrentYear ? now.getMonth() + 1 : 1;
    return Array.from({ length: 12 - minMonth + 1 }, (_, i) => i + minMonth);
  }, [year, now]);
  const availableDays = useMemo(() => {
    const isCurrentYear = year === now.getFullYear();
    const isCurrentMonth = isCurrentYear && month === (now.getMonth() + 1);
    const lastDay = new Date(year, month, 0).getDate();
    const minDay = isCurrentMonth ? now.getDate() + 1 : 1;
    if (minDay > lastDay) return [];
    return Array.from({ length: lastDay - minDay + 1 }, (_, i) => i + minDay);
  }, [year, month, now]);

  // 보정 로직
  useEffect(() => {
    if (year === now.getFullYear() && month < now.getMonth() + 1) setMonth(now.getMonth() + 1);
  }, [year, now]);
  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(day)) setDay(availableDays[0]);
  }, [availableDays, day]);

  // 모달 닫힐 때 사운드 중지
  useEffect(() => {
    if (!isOpen) {
      stopAlarmSound();
      setPlayingSoundId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const d = new Date(initialData.date);
        setName(initialData.name);
        setAlarmEnabled(!!initialData.alarmEnabled);
        setAlarmSoundId(initialData.alarmSoundId || ALARM_SOUNDS[0].id);
        setYear(d.getFullYear());
        setMonth(d.getMonth() + 1);
        setDay(d.getDate());
        setMode('date');
      } else {
        setName('');
        setAlarmEnabled(false);
        setAlarmSoundId(ALARM_SOUNDS[0].id);
        setYear(now.getFullYear());
        setMonth(now.getMonth() + 1);
        setDay(now.getDate() + 1); // D-day 기본값은 내일
        setMode('date');
        setDurMonths('0');
        setDurDays('0');
      }
    }
  }, [isOpen, initialData, now]);

  if (!isOpen) return null;

  const handleToggleSound = (soundId: string) => {
    if (playingSoundId === soundId) {
      stopAlarmSound();
      setPlayingSoundId(null);
    } else {
      playAlarmSound(soundId);
      setPlayingSoundId(soundId);
      // 5초 후 UI 상태 자동 복구 (audioEngine의 자동 정지와 동기화)
      setTimeout(() => {
        setPlayingSoundId(prev => prev === soundId ? null : prev);
      }, 5000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    let targetDateStr = '';
    if (mode === 'date') targetDateStr = new Date(year, month - 1, day).toISOString();
    else {
      const target = new Date();
      target.setMonth(target.getMonth() + parseInt(durMonths || '0'));
      target.setDate(target.getDate() + parseInt(durDays || '0'));
      targetDateStr = target.toISOString();
    }
    onAdd(name, targetDateStr, alarmEnabled, initialData?.id, alarmSoundId);
    setName(''); setDurMonths('0'); setDurDays('0'); setAlarmEnabled(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md border rounded-[2.5rem] p-6 sm:p-8 shadow-2xl bg-[#111] border-white/10 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
          <button onClick={onClose} className="absolute top-4 right-4 transition-colors text-white/40 hover:text-red-400 p-2"><X size={30} /></button>
          <h2 className="text-2xl font-medium mb-6 text-white font-serif">{initialData ? t.modalTitleEdit : t.modalTitleAdd}</h2>
          
          <div className="flex p-1 rounded-2xl mb-6 border bg-white/5 border-white/5">
            <button type="button" onClick={() => setMode('date')} className={`flex-1 py-2 rounded-xl text-[16px] font-medium flex items-center justify-center gap-2 transition-all ${mode === 'date' ? 'bg-white text-black' : 'text-white/40'}`}>
              <Calendar size={16} /> {t.modalDateMode}
            </button>
            <button type="button" onClick={() => setMode('duration')} className={`flex-1 py-2 rounded-xl text-[16px] font-medium flex items-center justify-center gap-2 transition-all ${mode === 'duration' ? 'bg-white text-black' : 'text-white/40'}`}>
              <Clock size={16} /> {t.modalDurationMode}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 flex flex-col">
            <div className="space-y-2">
              <label className="text-[16px] font-light ml-1 text-white/80 tracking-widest uppercase tracking-[0.1em]">{t.modalDdayName}</label>
              <input type="text" placeholder={t.modalDdayNamePlaceholder} required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 transition-all bg-white/5 border-white/10 text-white font-light" />
            </div>

            <div className="min-h-[160px] relative">
              {mode === 'date' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[16px] font-light text-white/80 tracking-widest uppercase tracking-[0.1em]" >{t.modalTargetDate}</label>
                    <button type="button" onClick={() => setIsCalendarOpen(true)} className="p-1.5 rounded-xl border transition-all hover:bg-white/10 border-white/10"><Calendar size={16} className="text-white/60" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-0 p-0.5 border rounded-[1.25rem] bg-black border-white/20 overflow-hidden isolate">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-light text-white/90 mt-3 uppercase tracking-widest text-center">YEAR</span>
                      <WheelPicker options={availableYears} value={year} onChange={setYear} />
                    </div>
                    <div className="flex flex-col items-center border-x border-white/10">
                      <span className="text-[11px] font-light text-white/90 mt-3 uppercase tracking-widest text-center">MONTH</span>
                      <WheelPicker options={availableMonths} value={month} onChange={setMonth} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-light text-white/90 mt-3 uppercase tracking-widest text-center">DAY</span>
                      <WheelPicker options={availableDays.length > 0 ? availableDays : [day]} value={day} onChange={setDay} />
                    </div>
                  </div>
                </div>
              )}
              {mode === 'duration' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[16px] font-light ml-1 text-white/70 tracking-widest uppercase">{t.modalAddMonths}</label>
                    <input type="number" min="0" value={durMonths} onChange={(e) => setDurMonths(e.target.value)} className="w-full rounded-2xl px-5 py-3.5 text-base font-lexend font-medium focus:outline-none focus:ring-2 transition-all bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[16px] font-light ml-1 text-white/70 tracking-widest uppercase">{t.modalAddDays}</label>
                    <input type="number" min="0" value={durDays} onChange={(e) => setDurDays(e.target.value)} className="w-full rounded-2xl px-5 py-3.5 text-base font-lexend font-medium focus:outline-none focus:ring-2 transition-all bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-[1.5rem] border bg-white/5 border-white/10">
                <div className="flex items-center gap-4">
                  {alarmEnabled ? <Volume2 size={20} className="text-lime-500" /> : <VolumeX size={20} className="text-white/40" />}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t.modalAlarm}</span>
                    <span className="text-[9px] text-white/40 tracking-widest uppercase">{t.modalAlarmDesc}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlarmEnabled(!alarmEnabled)}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    alarmEnabled ? 'bg-lime-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      alarmEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {alarmEnabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[16px] font-light ml-1 text-white/70 tracking-widest uppercase">{t.modalAlarmSound}</label>
                  <div className="flex flex-col gap-2">
                    {ALARM_SOUNDS.map((sound) => (
                      <div 
                        key={sound.id}
                        onClick={() => setAlarmSoundId(sound.id)}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${alarmSoundId === sound.id ? 'bg-lime-500/10 border-lime-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                      >
                        <span className={`text-xs font-medium ${alarmSoundId === sound.id ? 'text-white' : 'text-white/60'}`}>
                          {lang === 'ko' ? sound.nameKo : sound.nameEn}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleSound(sound.id); }}
                          className={`p-1.5 rounded-lg transition-all ${
                            playingSoundId === sound.id 
                              ? 'bg-lime-500 text-black' 
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {playingSoundId === sound.id ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full font-medium py-3 rounded-2xl sm:rounded-3xl transition-all shadow-2xl bg-gradient-to-r from-yellow-300 to-lime-500 text-black hover:opacity-90 tracking-widest text-lg sm:text-xl lg:text-2xl">
              {initialData ? t.modalSubmitEdit : t.modalSubmitAdd}
            </button>
          </form>
        </div>
      </div>
      <CalendarLayer isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={{ year, month, day }} onSelect={(y, m, d) => { setYear(y); setMonth(m); setDay(d); }} lang={lang} disablePast={true} />
    </>
  );
};

export default AnniversaryModal;