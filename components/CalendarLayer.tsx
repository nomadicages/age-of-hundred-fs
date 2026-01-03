import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface CalendarLayerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: { year: number; month: number; day: number };
  onSelect: (year: number, month: number, day: number) => void;
  lang: Language;
  disableFuture?: boolean; // 생년월일용 (미래 차단)
  disablePast?: boolean;   // D-day용 (오늘 포함 과거 차단)
}

const CalendarLayer: React.FC<CalendarLayerProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSelect, 
  lang, 
  disableFuture = false, 
  disablePast = false 
}) => {
  const t = translations[lang];
  
  // 현재 달력에서 보여주고 있는 기준 날짜 상태
  const [viewDate, setViewDate] = useState(new Date());

  // 달력이 열릴 때마다 부모가 선택한 날짜로 화면 이동
  useEffect(() => {
    if (isOpen && selectedDate.year && selectedDate.month) {
      setViewDate(new Date(selectedDate.year, selectedDate.month - 1, 1));
    }
  }, [isOpen, selectedDate.year, selectedDate.month]);

  // 그리드 계산을 위한 변수들 (viewDate가 바뀔 때마다 실시간 계산)
  const { year, month, totalDays, startDayOffset } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return {
      year: y,
      month: m,
      totalDays: new Date(y, m + 1, 0).getDate(), // 해당 월의 마지막 날짜
      startDayOffset: new Date(y, m, 1).getDay() // 해당 월 1일의 요일 (0:일 ~ 6:토)
    };
  }, [viewDate]);

  // 42칸(6주) 달력 그리드 생성
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startDayOffset; i++) cells.push(null); // 시작일 앞 빈칸
    for (let d = 1; d <= totalDays; d++) cells.push(d); // 날짜 채우기
    while (cells.length < 42) cells.push(null); // 남은 칸 빈칸
    return cells;
  }, [startDayOffset, totalDays]);

  if (!isOpen) return null;

  // 날짜 선택 제한 로직
  const isDateDisabled = (day: number) => {
    const cellDate = new Date(year, month, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (disableFuture) return cellDate > today; // 내일 이후 차단
    if (disablePast) return cellDate <= today;   // 오늘 포함 이전 차단
    return false;
  };

  // 핸들러 함수들
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const prevYear = () => setViewDate(new Date(year - 1, month, 1));
  const nextYear = () => setViewDate(new Date(year + 1, month, 1));

  const monthNames = lang === 'ko' 
    ? ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
  const dayLabels = lang === 'ko'
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      {/* 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-[460px] border rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] bg-[#151515] text-white border-white/10 flex flex-col p-12 z-[1010]">
        
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all">
          <X size={20} />
        </button>

        {/* 연도 이동 헤더 */}
        <div className="flex items-center justify-between w-full mb-4 px-2 mt-2">
          <button onClick={prevYear} className="p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronsLeft size={16} /></button>
          <div className="text-[12px] font-bold opacity-40 tracking-widest">{year}{lang === 'ko' ? '년' : ''}</div>
          <button onClick={nextYear} className="p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"><ChevronsRight size={16} /></button>
        </div>

        {/* 월 이동 헤더 */}
        <div className="flex items-center justify-between w-full mb-6 px-2">
          <button onClick={prevMonth} className="p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-90"><ChevronLeft size={20} /></button>
          <div className="text-2xl font-serif font-black tracking-tight">{monthNames[month]}</div>
          <button onClick={nextMonth} className="p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-90"><ChevronRight size={20} /></button>
        </div>

        {/* 요일 라벨 */}
        <div className="grid grid-cols-7 gap-2 w-full mb-4">
          {dayLabels.map(d => (
            <div key={d} className="text-[10px] font-black text-center text-white/20 uppercase tracking-tighter">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1.5 w-full">
          {gridCells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;
            
            const disabled = isDateDisabled(day);
            const isSelected = selectedDate.year === year && selectedDate.month === month + 1 && selectedDate.day === day;

            return (
              <button
                key={`${year}-${month}-${day}`}
                disabled={disabled}
                onClick={() => { onSelect(year, month + 1, day); onClose(); }}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300
                  ${isSelected ? "bg-white text-black shadow-xl scale-110 z-10" : "text-white"}
                  ${disabled ? "opacity-10 cursor-not-allowed" : "hover:bg-white/10 hover:scale-105"}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* 오늘로 이동 버튼 */}
        <div className="mt-8 pt-6 border-t border-white/5 w-full flex justify-center">
          <button 
            onClick={() => {
              const d = new Date();
              onSelect(d.getFullYear(), d.getMonth() + 1, d.getDate());
              onClose();
            }}
            className="text-[11px] font-black px-10 py-3.5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-white/60 tracking-widest uppercase"
          >
            {t.today}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarLayer;