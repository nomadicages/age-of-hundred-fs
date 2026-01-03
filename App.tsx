
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Settings, Bell, Plus, Trash2, Volume2, AlertTriangle, Heart, X, Globe, Edit3, Sparkles } from 'lucide-react';
import { TimeUnit, Anniversary, LifeProgress, Language, DDayItem, Advertisement } from './types';
import { translations } from './translations';
import VisualBackground from './components/VisualBackground';
import BirthInput from './components/BirthInput';
import TimerDisplay from './components/TimerDisplay';
import AnniversaryModal from './components/AnniversaryModal';
import { AdMob } from '@capacitor-community/admob';
import AdSummaryModal from './components/AdSummaryModal';
import AdSlot from './components/AdSlot';
import SplashScreen from './components/SplashScreen';
import { playAlarmSound } from './audioEngine';
import { GoogleGenAI } from "@google/genai";
import { loadNativeAds, NativeAdData } from './nativeAdService';

const UNITS: TimeUnit[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('centurion_lang');
    return (saved as Language) || 'en'; // 기본값을 'en'으로 변경
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Helper to get a deterministic "Insight of the Day" from local pool
  const getDailyLocalInsight = useCallback((currentLang: Language) => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const pool = translations[currentLang].lifeInsights;
    // Select deterministic index based on day of year, wrapping if necessary
    const index = dayOfYear % pool.length;
    return pool[index];
  }, []);

  const [aiInsight, setAiInsight] = useState<string>(() => getDailyLocalInsight(lang));
  const [isAiLoading, setIsAiLoading] = useState(false);


  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' }
  ];

  
  const changeLang = (newLang: Language) => {
    setLang(newLang);
    setShowLangMenu(false);
    if (typeof getDailyLocalInsight === 'function') {
      setAiInsight(getDailyLocalInsight(newLang));
    }
  };

  const initializeAdMob = async () => {
    try {
      // 1. AdMob SDK 초기화
      await AdMob.initialize();

      // 2. (선택사항) iOS/Android 개인정보 보호 승인 요청 (ATT)
      // 사용자의 데이터를 추적하려면 이 단계가 필요합니다.
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization();
      }

      console.log('AdMob 초기화 완료');
    } catch (error) {
      console.error('AdMob 초기화 실패:', error);
    }
  };

  const [birthDate, setBirthDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('centurion_birthdate');
    return saved ? new Date(saved) : null;
  });

  useEffect(() => {
    // 앱이 시작될 때 AdMob 초기화 실행
    initializeAdMob();
    
    // 네이티브 광고 로드
    const loadAds = async () => {
      try {
        const nativeAds = await loadNativeAds(10);
        // NativeAdData를 Advertisement로 변환
        let convertedAds: Advertisement[] = nativeAds.map((ad, index) => ({
          id: ad.id || `ad-${Date.now()}-${index}`,
          isAd: true,
          title: ad.headline || '',
          date: new Date().toISOString(),
          imageUrl: ad.images?.[0] || ad.icon || '',
          link: '#',
          provider: ad.advertiser || 'Sponsored',
          providerDomain: undefined,
          sourceLinks: undefined,
        }));
        
        // 웹 환경에서 광고가 없으면 테스트용 더미 광고 생성
        if (convertedAds.length === 0) {
          convertedAds = Array.from({ length: 10 }, (_, index) => ({
            id: `dummy-ad-${Date.now()}-${index}`,
            isAd: true,
            title: lang === 'ko' ? '테스트 광고' : 'Test Ad',
            date: new Date().toISOString(),
            imageUrl: '',
            link: '#',
            provider: 'Sponsored',
            providerDomain: undefined,
            sourceLinks: undefined,
          }));
        }
        
        setRealNativeAds(convertedAds);
      } catch (error) {
        console.error('Failed to load native ads:', error);
        // 에러 발생 시에도 더미 광고 생성
        const dummyAds: Advertisement[] = Array.from({ length: 10 }, (_, index) => ({
          id: `dummy-ad-${Date.now()}-${index}`,
          isAd: true,
          title: lang === 'ko' ? '테스트 광고' : 'Test Ad',
          date: new Date().toISOString(),
          imageUrl: '',
          link: '#',
          provider: 'Sponsored',
          providerDomain: undefined,
          sourceLinks: undefined,
        }));
        setRealNativeAds(dummyAds);
      }
    };
    
    loadAds();
  }, [lang]);

  
  
  const [isEditing, setIsEditing] = useState(false);
  const [unit, setUnit] = useState<TimeUnit>('days');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>(() => {
    const saved = localStorage.getItem('centurion_anniversaries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [hiddenAdIds, setHiddenAdIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('centurion_hidden_ads');
    return saved ? JSON.parse(saved) : [];
  });

  const [realNativeAds, setRealNativeAds] = useState<Advertisement[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnniversary, setEditingAnniversary] = useState<Anniversary | null>(null);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [now, setNow] = useState(new Date());
  const [activeAlarm, setActiveAlarm] = useState<Anniversary | null>(null);

  
  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchThreshold = 50;

  const t = translations[lang];

  const requestFullscreen = useCallback(() => {
    if (isStandalone || document.fullscreenElement || (document as any).webkitFullscreenElement) return;
    
    const docEl = document.documentElement;
    const request = docEl.requestFullscreen || 
                    (docEl as any).webkitRequestFullscreen || 
                    (docEl as any).mozRequestFullScreen || 
                    (docEl as any).msRequestFullscreen;
    if (request) {
      request.call(docEl).catch(() => {});
    }
  }, [isStandalone]);

  const targetDate = useMemo(() => {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    date.setFullYear(date.getFullYear() + 100);
    return date;
  }, [birthDate]);

  const progress: LifeProgress | null = useMemo(() => {
    if (!birthDate || !targetDate) return null;
    const diffMs = targetDate.getTime() - now.getTime();
    const totalMs = targetDate.getTime() - birthDate.getTime();
    const percentage = Math.max(0, Math.min(100, (diffMs / totalMs) * 100));
    return {
      percentage,
      yearsRemaining: diffMs / (1000 * 60 * 60 * 24 * 365.25),
      monthsRemaining: diffMs / (1000 * 60 * 60 * 24 * 30.44),
      daysRemaining: diffMs / (1000 * 60 * 60 * 24),
      hoursRemaining: diffMs / (1000 * 60 * 60),
      minutesRemaining: diffMs / (1000 * 60),
      secondsRemaining: diffMs / 1000
    };
  }, [birthDate, targetDate, now]);

  const changeUnit = (newUnit: TimeUnit) => {
    const oldIndex = UNITS.indexOf(unit);
    const newIndex = UNITS.indexOf(newUnit);
    if (oldIndex === newIndex) return;
    
    setSlideDirection(newIndex > oldIndex ? 'right' : 'left');
    setUnit(newUnit);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    const currentIndex = UNITS.indexOf(unit);

    if (Math.abs(diffX) > touchThreshold) {
      if (diffX > 0) {
        if (currentIndex < UNITS.length - 1) {
          changeUnit(UNITS[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          changeUnit(UNITS[currentIndex - 1]);
        }
      }
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!progress || !birthDate) return;

    const generateInsight = async () => {
      // Use local daily insight as immediate state, then upgrade if Gemini is available
      const localFallback = getDailyLocalInsight(lang);
      
      if (!process.env.API_KEY) {
        setAiInsight(localFallback);
        return;
      }

      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemPrompt = lang === 'ko' 
          ? "당신은 인생의 철학자입니다. 100세 인생 중 현재 위치에 어울리는 짧고 깊은 성찰의 문장 하나를 한국어로 작성하세요. 25자 이내."
          : "You are a life philosopher. Write a short, profound reflection on the current life stage. Under 50 characters.";
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Current life progress: ${(100 - progress.percentage).toFixed(1)}% through a 100-year life.`,
          config: { systemInstruction: systemPrompt }
        });
        
        const result = response.text?.trim();
        if (result) setAiInsight(result);
        else setAiInsight(localFallback);
      } catch (error) { 
        console.error("AI Insight failed, falling back to local pool", error);
        setAiInsight(localFallback);
      } finally { 
        setIsAiLoading(false); 
      }
    };

    const timer = setTimeout(generateInsight, 2500);
    return () => clearTimeout(timer);
  }, [progress?.percentage, lang, birthDate, getDailyLocalInsight]);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               window.matchMedia('(display-mode: fullscreen)').matches ||
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    const handleGlobalInteraction = () => {
      requestFullscreen();
    };
    window.addEventListener('click', handleGlobalInteraction, { once: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { once: true });

    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);
      anniversaries.forEach(ann => {
        if (ann.alarmEnabled && !ann.alarmTriggered) {
          const annTime = new Date(ann.date).getTime();
          if (currentTime.getTime() >= annTime && currentTime.getTime() <= annTime + 5000) {
             setActiveAlarm(ann);
             if (ann.alarmSoundId) playAlarmSound(ann.alarmSoundId);
             setAnniversaries(prev => prev.map(a => a.id === ann.id ? { ...a, alarmTriggered: true } : a));
          }
        }
      });
    }, 1000);
    
    return () => { 
      clearInterval(timer);
    };
  }, [anniversaries, requestFullscreen, isStandalone]);

  useEffect(() => {
    localStorage.setItem('centurion_lang', lang);
    if (birthDate) localStorage.setItem('centurion_birthdate', birthDate.toISOString());
    localStorage.setItem('centurion_anniversaries', JSON.stringify(anniversaries));
    localStorage.setItem('centurion_hidden_ads', JSON.stringify(hiddenAdIds));
  }, [lang, birthDate, anniversaries, hiddenAdIds]);

  const handleSetBirthDate = (date: Date) => {
    requestFullscreen(); 
    setBirthDate(date);
    setIsEditing(false);
  };

  const handleHideAd = (id: string) => {
    setHiddenAdIds(prev => [...prev, id]);
    setSelectedAd(null);
  };

  const addAnniversary = (name: string, date: string, alarmEnabled: boolean, id?: string, soundId?: string) => {
    if (id) {
      setAnniversaries(prev => prev.map(a => a.id === id ? { ...a, name, date, alarmEnabled, alarmSoundId: soundId } : a));
    } else {
      const newAnn: Anniversary = { id: crypto.randomUUID(), name, date, alarmEnabled, alarmTriggered: false, alarmSoundId: soundId };
      setAnniversaries(prev => [...prev, newAnn]);
    }
    setIsModalOpen(false);
    setEditingAnniversary(null);
  };

  const removeAnniversary = (id: string) => {
    setAnniversaries(prev => prev.filter(a => a.id !== id));
  };

  const startEditAnniversary = (ann: Anniversary) => {
    setEditingAnniversary(ann);
    setIsModalOpen(true);
  };

  const getRemainingTimeStr = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    if (diff < 0) return t.ended;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) return <><span className="font-lexend font-semibold">{days}</span>{t.daysRemaining}</>;
    if (hours > 0) return <><span className="font-lexend font-semibold">{hours}</span>{t.hoursRemaining}</>;
    return <><span className="font-lexend font-semibold">{mins}</span>{t.minsRemaining}</>;
  };

  const combinedTimeline = useMemo(() => {
    const futureAnniversaries = anniversaries
      .filter(ann => new Date(ann.date).getTime() > now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    if (futureAnniversaries.length === 0) return [];
  
    const result: (Anniversary | Advertisement)[] = [];
    let adPointer = 0;
  
    futureAnniversaries.forEach((ann, index) => {
      result.push(ann);
  
      // [로직] 일정 1개 이상일 때 광고 삽입
      // 첫 번째 일정 다음에 광고, 그 다음부터는 3개마다 광고 삽입
      const shouldInsertAd = index === 0 || (index + 1) % 3 === 0;
      
      if (shouldInsertAd && realNativeAds.length > 0 && realNativeAds[adPointer]) {
        result.push({
          ...realNativeAds[adPointer],
          date: new Date(new Date(ann.date).getTime() + 1000).toISOString()
        });
        adPointer = (adPointer + 1) % realNativeAds.length; // 순환 사용
      }
    });
  
    return result;
  }, [anniversaries, realNativeAds, now]);

  

  return (
    <>
      {showSplash && <SplashScreen onStarted={() => setShowSplash(false)} />}
      <div className={`transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        {(!birthDate || isEditing) ? (
          <div className="relative h-[100dvh] w-screen flex items-start sm:items-center justify-center bg-black px-4 pt-safe pb-safe overflow-y-auto no-scrollbar">
            <VisualBackground percentage={100 - (progress?.percentage || 0)} theme="standard" />
            <div className="relative z-10 w-full max-w-lg p-6 sm:p-10 backdrop-blur-3xl border rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl bg-black/60 border-white/10 transition-all duration-500 my-auto">
              
           

              <div className="absolute top-6 right-6 flex items-center gap-3 z-[300]">
                <div className="relative z-[300]">
                  <button 
                    onClick={() => setShowLangMenu(!showLangMenu)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 transition-all text-white/70 hover:text-white backdrop-blur-md relative z-[300]"
                  >
                    <Globe size={14} />
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      {languages.find(l => l.code === lang)?.code.toUpperCase() || 'EN'}
                    </span>
                  </button>
                  {showLangMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-[250]" 
                        onClick={() => setShowLangMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl z-[300]">
                        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                          {languages.map((language) => (
                            <button
                              key={language.code}
                              onClick={() => changeLang(language.code)}
                              className={`w-full px-4 py-3 text-left transition-all flex-shrink-0 ${
                                lang === language.code 
                                  ? 'bg-white/20 text-white' 
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{language.nativeName}</span>
                                <span className="text-xs text-white/50">{language.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {birthDate && (
                  <button onClick={() => setIsEditing(false)} className="p-2 rounded-full transition-all text-white/30 hover:text-white hover:bg-white/10 active:scale-90">
                    <X size={24} strokeWidth={2} />
                  </button>
                )}
              </div>
              <div className="mb-4 sm:mb-6 mt-6 sm:mt-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-tight">{t.title}</h1>
              </div>
              <div className="mb-8 sm:mb-10">
                <p className="leading-relaxed text-xs sm:text-sm text-white/50 font-medium max-w-[280px] sm:max-w-sm">{t.description}</p>
              </div>
              <BirthInput onComplete={handleSetBirthDate} initialDate={birthDate || undefined} isEditing={!!birthDate} lang={lang} />
            </div>

            
          </div>
        ) : (
          <div className="relative h-[100dvh] w-screen flex flex-col overflow-hidden bg-black text-white touch-none pt-safe pb-safe">
            <VisualBackground percentage={100 - (progress?.percentage || 0)} theme="standard" />
            
            {activeAlarm && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl animate-pulse">
                <div className="text-center p-8 max-w-lg">
                  <AlertTriangle size={60} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                  <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-4 tracking-tighter">{activeAlarm.name}</h2>
                  <p className="text-lg text-white/80 font-bold tracking-widest">{t.alarmMsg}</p>
                  <button onClick={() => setActiveAlarm(null)} className="mt-10 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform">{t.alarmOn}</button>
                </div>
              </div>
            )}
            
            <header className="relative z-20 w-full px-4 sm:px-6 py-4 flex flex-col gap-4 flex-none max-w-5xl mx-auto">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Heart size={14} className="text-red-500 animate-pulse" fill="currentColor" />
                  <div className="h-1 w-20 sm:w-32 md:w-48 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${progress?.percentage}%` }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="p-2.5 rounded-full transition-all border bg-white/5 hover:bg-white/15 border-white/10 text-white/70 hover:text-white active:scale-90"><Settings size={16} /></button>
                </div>
              </div>
              <div className="flex justify-center w-full">
                <div className="flex w-full bg-transparent">
                  <div className="flex w-full">
                    {UNITS.map((u, idx) => (
                      <button 
                        key={u} 
                        onClick={() => changeUnit(u)} 
                        className={`flex-1 py-3 text-[12px] sm:text-base font-medium transition-all relative flex items-center justify-center
                          ${unit === u ? 'text-white' : 'text-white/30 hover:text-white/60'}
                        `}
                      >
                        {t.unitLabels[u]}
                        {unit === u && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-300 to-lime-500" />
                        )}
                        {idx !== UNITS.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-[1px] bg-white/10" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </header>
            
            <main 
              className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0 select-none cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-center w-full max-w-6xl">
                <h2 style={{ fontSize: 'clamp(0.8rem, 2vh, 1.2rem)' }} className="font-black mb-12 sm:mb-20 tracking-[0.5em] uppercase opacity-40 text-white text-center font-serif leading-none">{t.title}</h2>
                <TimerDisplay progress={progress} unit={unit} lang={lang} direction={slideDirection} />
                
                <div className="mt-6 sm:mt-10 opacity-80 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-2xl mx-auto flex items-center justify-center gap-3 py-2">
                  <Sparkles size={16} className={`${isAiLoading ? 'animate-spin text-lime-400' : 'text-lime-400'}`} />
                  <p className="text-xs sm:text-base font-serif italic text-white/90 tracking-tight leading-relaxed">
                    {`"${aiInsight}"`}
                  </p>
                </div>
              </div>
            </main>
            
            <footer className="relative z-20 w-full flex justify-center pb-6 sm:pb-10 px-4 sm:px-6 flex-none max-w-5xl mx-auto mb-safe">
              <div className="w-full backdrop-blur-3xl border rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-2xl bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-4 px-1 sm:px-2">
                  <h3 className="flex items-center gap-2 text-[10px] sm:text-xs font-black tracking-widest text-white/60"><Bell size={14} className="opacity-50" />{t.ddayList}</h3>
                  <button onClick={() => { setEditingAnniversary(null); setIsModalOpen(true); }} className="p-1.5 sm:p-2 rounded-xl transition-all shadow-lg shadow-lime-500/20 bg-gradient-to-r from-yellow-300 to-lime-500 text-black hover:scale-110 active:scale-95"><Plus size={16} /></button>
                </div>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 scroll-smooth no-scrollbar">
                  {combinedTimeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full py-8 space-y-2">
                      <p className="text-[10px] sm:text-xs italic text-white/30 font-medium">{t.noDday}</p>
                    </div>
                  ) : (
                    combinedTimeline.map((item, idx) => {
                      const itemDate = new Date(item.date);
                      const isKo = lang === 'ko';
                      const formattedDate = isKo 
                        ? <><span className="font-lexend font-semibold">{itemDate.getFullYear()}</span>. <span className="font-lexend font-semibold">{itemDate.getMonth() + 1}</span>. <span className="font-lexend font-semibold">{itemDate.getDate()}</span></>
                        : <><span className="font-lexend font-semibold">{itemDate.getMonth() + 1}</span>/<span className="font-lexend font-semibold">{itemDate.getDate()}</span>/<span className="font-lexend font-semibold">{itemDate.getFullYear()}</span></>;
                      const isAd = 'isAd' in item;
                      const isPast = new Date(item.date).getTime() < now.getTime();
                      if (isAd) return <AdSlot key={item.id} ad={item as Advertisement} lang={lang} onClick={setSelectedAd} getRemainingTimeStr={getRemainingTimeStr} />;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => startEditAnniversary(item as Anniversary)}
                          className={`flex-shrink-0 w-44 sm:w-60 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all cursor-pointer ${idx === 0 ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20'} ${isPast ? 'opacity-50' : 'hover:border-white/40'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-lime-500 text-black' : (isPast ? 'bg-white/10 text-white/30' : 'bg-white/20 text-white')}`}>{idx === 0 ? 'NEXT' : (isPast ? t.past : t.upcoming)}</span>
                            <div className="flex gap-2">
                              {item.alarmEnabled && <Volume2 size={14} className={isPast ? 'text-white/20' : 'text-yellow-500'} />}
                              <button onClick={(e) => { e.stopPropagation(); startEditAnniversary(item as Anniversary); }} className="text-white/20 hover:text-lime-400 transition-colors"><Edit3 size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); removeAnniversary(item.id); }} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </div>
                          <p className="text-sm sm:text-base font-black truncate mb-1 text-white">{item.name}</p>
                          <div className="space-y-0.5">
                            <p className="text-[10px] sm:text-[11px] font-bold text-white/30">{formattedDate}</p>
                            <p className="text-[11px] sm:text-xs font-black text-lime-400">{getRemainingTimeStr(item.date)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </footer>
            
            <AnniversaryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAnniversary(null); }} onAdd={addAnniversary} initialData={editingAnniversary} lang={lang} />
            <AdSummaryModal ad={selectedAd} isOpen={!!selectedAd} onClose={() => setSelectedAd(null)} onHideAd={handleHideAd} lang={lang} />
          </div>
        )}
      </div>
    </>
  );
};

export default App;
