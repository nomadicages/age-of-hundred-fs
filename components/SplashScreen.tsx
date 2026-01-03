
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { resumeAudioCtx } from '../audioEngine';

interface Particle {
  x: number;
  y: number;
  z: number;
  char: string;
  isDigit: boolean;
  isHero?: boolean;
  opacity: number;
  speed: number;
}

interface Props {
  onStarted: () => void;
}

const SplashScreen: React.FC<Props> = ({ onStarted }) => {
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const animationIdRef = useRef<number>(0);
  const startTriggeredRef = useRef(false);

  const startJourney = useCallback(async () => {
    if (startTriggeredRef.current) return;
    startTriggeredRef.current = true;

    // 사용자 상호작용 시점에 오디오 컨텍스트 활성화 (안드로이드 필수)
    await resumeAudioCtx();

    const docEl = document.documentElement;
    const request = docEl.requestFullscreen || 
                    (docEl as any).webkitRequestFullscreen || 
                    (docEl as any).mozRequestFullScreen || 
                    (docEl as any).msRequestFullscreen;

    if (request) {
      request.call(docEl).catch(() => {
        console.warn('Automatic fullscreen was blocked by the browser.');
      });
    }

    setHasUserStarted(true);
    startTimeRef.current = Date.now();
    
    setTimeout(() => {
      onStarted();
    }, 1800);
  }, [onStarted]);

  useEffect(() => {
    const autoTimer = setTimeout(() => {
      if (!startTriggeredRef.current) {
        // 자동 시작 시도 (실패할 수 있음)
        startJourney();
      }
    }, 4500); // 사용자 클릭 유도를 위해 좀 더 대기
    return () => clearTimeout(autoTimer);
  }, [startJourney]);

  useEffect(() => {
    if (!hasUserStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleCount = 100;
    const maxDepth = 1500;
    let heroSpawned = false;
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        spawnParticle(true);
      }
    };

    const spawnParticle = (randomZ = false, isHero = false) => {
      particles.push({
        x: isHero ? 0 : (Math.random() - 0.5) * canvas.width * 3,
        y: isHero ? 0 : (Math.random() - 0.5) * canvas.height * 3,
        z: randomZ ? Math.random() * maxDepth : maxDepth,
        char: isHero ? "100" : Math.floor(Math.random() * 10).toString(),
        isDigit: isHero ? true : Math.random() > 0.7,
        isHero: isHero,
        opacity: 0,
        speed: isHero ? 40 : (8 + Math.random() * 12)
      });
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const fov = 400; 

      if (elapsed > 500 && !heroSpawned) {
        spawnParticle(false, true);
        heroSpawned = true;
      }

      const sortedParticles = [...particles].sort((a, b) => b.z - a.z);
      for (let i = 0; i < sortedParticles.length; i++) {
        const p = sortedParticles[i];
        p.z -= p.speed;
        
        if (p.z <= 0) {
          const idx = particles.indexOf(p);
          if (idx > -1) particles.splice(idx, 1);
          if (elapsed < 1400 && !p.isHero) spawnParticle();
          continue;
        }

        const scale = fov / p.z;
        const x2d = centerX + p.x * scale;
        const y2d = centerY + p.y * scale;
        
        const opacity = p.isHero 
          ? (p.z > 800 ? 0 : Math.min(1, (800 - p.z) / 400))
          : Math.min(1, (maxDepth - p.z) / 400);

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
        ctx.font = p.isHero 
          ? `bold ${Math.floor(120 * scale)}px 'Maru Buri', serif` 
          : `${Math.floor(14 * scale)}px 'Lexend', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, x2d, y2d);
      }

      if (elapsed > 1400) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(elapsed - 1400) / 400})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [hasUserStarted]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden">
      {!hasUserStarted ? (
        <div className="flex flex-col items-center text-center px-6 animate-in fade-in duration-1000">
          <div className="mb-12 relative w-full">
             <div className="absolute inset-0 -m-8 bg-lime-500/10 blur-3xl rounded-full animate-pulse" />
             <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-[0.25em] relative z-10 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)] bg-gradient-to-r from-yellow-300 to-lime-500 bg-clip-text text-transparent whitespace-nowrap">
                Age of Hundred
             </h1>
          </div>

          <button 
            onClick={startJourney}
            className="group relative flex flex-col items-center gap-6 p-10 active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-white/[0.03] rounded-full blur-2xl group-hover:bg-white/10 transition-all scale-150" />
            <div className="relative p-6 rounded-full border border-white/20 group-hover:border-white/50 transition-all bg-black/40 backdrop-blur-md shadow-2xl shadow-white/5">
              <ChevronRight size={36} className="text-white/40 group-hover:text-white transition-colors translate-x-0.5" />
            </div>
            <span className="text-white/40 text-[11px] font-black tracking-[0.8em] uppercase group-hover:text-white transition-colors">
               Enter Journey
            </span>
          </button>

          <div className="absolute bottom-12 text-center opacity-40">
            <p className="text-[12px] font-semibold tracking-[0.4em] uppercase text-white leading-relaxed">
               Created By<br />PLIZM
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative">
           <canvas ref={canvasRef} className="w-full h-full block" />
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="animate-[fade-in-out_2s_ease-in-out_forwards] flex flex-col items-center">
                 <h2 className="text-xl sm:text-2xl font-serif font-black text-white/30 tracking-widest uppercase">
                    Journey Begun
                 </h2>
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: scale(0.9); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
