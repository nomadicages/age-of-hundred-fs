// nativeAdService.ts
import { AdMob, NativeAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const TEST_NATIVE_AD_ID = 'ca-app-pub-3940256099942544/2247696110';
const PROD_NATIVE_AD_ID = 'ca-app-pub-3933370356899243/6341217418';

const IS_DEV = import.meta.env.DEV;
const NATIVE_AD_ID = IS_DEV ? TEST_NATIVE_AD_ID : PROD_NATIVE_AD_ID;

export interface NativeAdData {
  id: string;
  isAd: true;
  headline: string;
  body: string;
  callToAction: string;
  advertiser: string;
  icon?: string;
  images?: string[];
  price?: string;
  store?: string;
  starRating?: number;
}

// [수정] adCache 변수 자체를 사용하지 않거나 항상 빈 배열로 초기화
let isLoading = false;

export const loadNativeAds = async (count: number = 3): Promise<NativeAdData[]> => {
  if (!Capacitor.isNativePlatform()) {
    return []; // 웹 환경에선 무조건 빈 배열 (목업 차단)
  }

  try {
    await AdMob.initialize();
  } catch (e) {
    console.log("AdMob initialization check:", e);
  }

  if (isLoading) return []; // 로딩 중이면 이전 캐시 대신 빈 배열 반환

  isLoading = true;

  try {
    const options: NativeAdOptions = {
      adId: NATIVE_AD_ID,
    };

    // AdMob 실제 광고 로드
    const result = await AdMob.prepareNativeAd(options);
    
    const nativeAd: NativeAdData = {
      id: `native-ad-${Date.now()}`,
      isAd: true,
      headline: result.headline || '',
      body: result.body || '',
      callToAction: result.callToAction || 'Learn More',
      advertiser: result.advertiser || 'Sponsored',
      icon: result.icon,
      images: result.images || [],
      price: result.price,
      store: result.store,
      starRating: result.starRating,
    };

    return [nativeAd]; // 로드 성공 시 실제 데이터만 반환
    
  } catch (error) {
    console.error('Failed to load native ads:', error);
    return []; // [핵심] 실패 시 절대 getMockAds를 호출하지 않고 빈 배열 반환
  } finally {
    isLoading = false;
  }
};

// [삭제] 기존에 존재하던 getMockAds 함수는 아예 지우거나 아래처럼 비워두세요.
const getMockAds = (count: number): NativeAdData[] => [];