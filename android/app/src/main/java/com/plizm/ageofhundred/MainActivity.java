package com.plizm.ageofhundred;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
// import 문 삭제 (에러의 원인)

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // registerPlugin 코드를 삭제하세요.
        // Capacitor 3+ 버전은 자동으로 플러그인을 인식하므로 이 코드가 없어도 광고가 잘 작동합니다.
    }
}

