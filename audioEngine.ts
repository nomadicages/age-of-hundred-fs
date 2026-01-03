type SoundId = 'zen' | 'pulse' | 'cosmic' | 'chime' | 'steady';

export const ALARM_SOUNDS: { id: SoundId; nameKo: string; nameEn: string }[] = [
  { id: 'zen', nameKo: '밝은 아침', nameEn: 'Bright Morning' },
  { id: 'pulse', nameKo: '기분 좋은 리듬', nameEn: 'Happy Rhythm' },
  { id: 'cosmic', nameKo: '반짝이는 별', nameEn: 'Sparkling Star' },
  { id: 'chime', nameKo: '상승하는 종소리', nameEn: 'Rising Chimes' },
  { id: 'steady', nameKo: '희망찬 파동', nameEn: 'Hopeful Wave' },
];

let audioCtx: AudioContext | null = null;
let activeGainNodes: GainNode[] = [];
let activeOscillators: OscillatorNode[] = [];
let stopTimer: NodeJS.Timeout | null = null;
let loopInterval: NodeJS.Timeout | null = null;

export const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
  }
  return audioCtx;
};

export const stopAlarmSound = () => {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
  if (loopInterval) { clearInterval(loopInterval); loopInterval = null; }

  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 현재 활성화된 Gain 노드들을 부드럽게 페이드 아웃 후 정지
  activeGainNodes.forEach(g => {
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } catch (e) {}
  });

  setTimeout(() => {
    activeOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    activeOscillators = [];
    activeGainNodes = [];
  }, 200);
};

export const playAlarmSound = async (id: string) => {
  const ctx = getAudioCtx();
  
  // 1. AudioContext 재개를 확실히 기다림 (끊김 방지 핵심)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // 기존 소리 정리
  stopAlarmSound();

  // 2. 약간의 여유 시간(0.1초)을 두어 브라우저가 오디오 버퍼를 준비하게 함
  const startTime = ctx.currentTime + 0.2;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  activeGainNodes.push(masterGain);
  
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(0.8, startTime + 0.05);

  const playNote = (freq: number, noteStartTime: number, duration: number, type: OscillatorType = 'sine', volume = 0.5) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, noteStartTime);
    
    g.gain.setValueAtTime(0, noteStartTime);
    g.gain.linearRampToValueAtTime(volume, noteStartTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, noteStartTime + duration);
    
    osc.connect(g).connect(masterGain);
    osc.start(noteStartTime);
    osc.stop(noteStartTime + duration);
    activeOscillators.push(osc);
  };

  const runPattern = (baseTime: number) => {
    switch (id) {
      case 'zen':
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
          playNote(freq, baseTime + i * 0.2, 1.2, 'sine', 0.6);
        });
        break;
      case 'pulse':
        [392.00, 440.00, 523.25, 587.33, 659.25].forEach((freq, i) => {
          const time = baseTime + i * 0.15;
          playNote(freq, time, 0.4, 'triangle', 0.4);
          playNote(freq * 2, time, 0.2, 'sine', 0.1);
        });
        break;
      case 'cosmic':
        for (let i = 0; i < 12; i++) {
          const freq = 880 * Math.pow(1.059, i);
          playNote(freq, baseTime + i * 0.05, 0.3, 'sine', 0.3);
        }
        break;
      case 'chime':
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const time = baseTime + i * 0.1;
          playNote(freq, time, 1.5, 'sine', 0.5);
          playNote(freq * 1.5, time, 0.8, 'sine', 0.2);
        });
        break;
      case 'steady':
        playNote(440, baseTime, 1.0, 'triangle', 0.4);
        playNote(659.25, baseTime + 0.5, 1.0, 'sine', 0.3);
        break;
      default:
        playNote(440, baseTime, 0.5, 'sine');
    }
  };

  runPattern(startTime);
  
  loopInterval = setInterval(() => {
    runPattern(ctx.currentTime + 0.1);
  }, 1200);

  stopTimer = setTimeout(() => {
    stopAlarmSound();
  }, 5000);
};

export const resumeAudioCtx = async () => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};