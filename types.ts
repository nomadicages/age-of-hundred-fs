
export type TimeUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';
export type Language = 'en' | 'ko' | 'ja' | 'de' | 'sv';
export type ThemeType = 'standard' | 'panorama';

export interface Anniversary {
  id: string;
  name: string;
  date: string; // ISO string
  alarmEnabled?: boolean;
  alarmTriggered?: boolean;
  alarmSoundId?: string;
}

export interface Advertisement {
  id: string;
  isAd: true;
  title: string;
  date: string;
  imageUrl: string;
  link: string;
  provider: string;
  providerDomain?: string;
  sourceLinks?: { uri: string; title: string }[];
  // Programmatic Ad Fields (AdMob/AdSense)
  adUnitPath?: string; 
  adSize?: [number, number];
  isProgrammatic?: boolean;
}

export type DDayItem = (Anniversary | Advertisement);

export interface LifeProgress {
  percentage: number;
  yearsRemaining: number;
  monthsRemaining: number;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
}

export interface SyncData {
  birthDate: string | null;
  anniversaries: Anniversary[];
  lang: Language;
  lastUpdated: string;
}
