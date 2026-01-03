import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plizm.ageofhundred',
  appName: 'Age of Hundred',
  webDir: 'dist',
  plugins: {
    AdMob: {
      // 앱 실행 시 AdMob SDK 자동 초기화
      initializeOnStartup: true,
      androidAppId: 'ca-app-pub-3933370356899243~6052744743' // 위와 동일한 ID
    }
  }
};

export default config;
