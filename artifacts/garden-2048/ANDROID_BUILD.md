# Garden 2048 — Android APK 빌드 가이드

## 사전 요구사항

### 1. Node.js
- [Node.js](https://nodejs.org/) v18 이상 설치
- 설치 확인: `node --version`

### 2. pnpm
```bash
npm install -g pnpm
```

### 3. Android Studio
- [Android Studio](https://developer.android.com/studio) 다운로드 & 설치
- 설치 중 아래 항목 포함 확인:
  - Android SDK
  - Android SDK Platform-Tools
  - Android Virtual Device (AVD)

### 4. Java (JDK)
- Android Studio에 포함된 JDK 자동 설치됨
- 별도 설치 시: [JDK 17](https://adoptium.net/) 권장

### 5. 환경 변수 설정 (Windows)
```
ANDROID_HOME = C:\Users\<사용자명>\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
```
PATH에 추가:
```
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
```

---

## 프로젝트 구조

```
artifacts/garden-2048/
├── src/                    # React 소스코드
├── public/                 # 정적 에셋
├── dist/public/            # Vite 빌드 결과물 (webDir)
├── android/                # Capacitor Android 프로젝트 (Android Studio에서 열기)
├── capacitor.config.ts     # Capacitor 설정
├── vite.config.ts          # Vite 설정
└── package.json
```

---

## 빌드 방법

### 방법 1: 스크립트 사용 (권장)

프로젝트 루트(`C:\Users\19002857\Desktop\plant2048`)에서:

```bash
# 1. 의존성 설치 (최초 1회)
pnpm install

# 2. 웹앱 빌드 + Android 동기화
pnpm --filter @workspace/garden-2048 android:sync

# 3. Android Studio 실행
pnpm --filter @workspace/garden-2048 android:open
```

### 방법 2: garden-2048 디렉토리에서 직접

```bash
cd artifacts/garden-2048

# 웹앱 빌드 (모바일용 상대경로 기준)
pnpm build:mobile

# Android 프로젝트 동기화
pnpm exec cap sync android

# Android Studio 열기
pnpm exec cap open android
```

### 방법 3: 도우미 스크립트 사용 (Windows)

```bash
# 프로젝트 루트에서
build-android.bat
```

---

## APK 생성 방법

### Android Studio에서 Debug APK 생성

1. `pnpm android:open` 으로 Android Studio 실행
2. Gradle 동기화 완료 대기 (최초 실행 시 수 분 소요)
3. 메뉴: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. 생성 위치:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Release APK 생성 (서명 필요)

1. 메뉴: **Build → Generate Signed Bundle / APK**
2. **APK** 선택 → Next
3. Keystore 생성 또는 기존 것 사용
4. Build Variant: **release** 선택
5. Finish

---

## Android Studio 첫 실행 가이드

1. `pnpm android:open` 실행 시 Android Studio가 `android/` 폴더를 엶
2. **"Trust Project"** 클릭
3. Gradle 동기화 대기 (우하단 진행률 확인)
4. SDK 설치 안내 팝업 시 → **Install** 클릭
5. 상단 툴바에서 디바이스 선택 후 ▶ 버튼으로 실행

---

## 코드 수정 후 재빌드 흐름

```
코드 수정
    ↓
pnpm build:mobile          # Vite 빌드 (dist/public 갱신)
    ↓
pnpm exec cap sync android # dist/public → android/app/src/main/assets/public 복사
    ↓
Android Studio에서 ▶ 실행  # 앱 재실행
```

또는 한 번에:
```bash
pnpm android:sync
```

---

## 문제 해결

### Gradle 빌드 실패
```bash
# android/ 폴더에서
./gradlew clean
./gradlew assembleDebug
```

### SDK 버전 오류
- Android Studio → SDK Manager에서 필요한 API Level 설치
- `android/app/build.gradle`에서 `compileSdkVersion` 확인

### capacitor.config.ts 설정

```ts
// artifacts/garden-2048/capacitor.config.ts
{
  appId: 'com.garden2048.app',   // 앱 패키지 ID
  appName: 'Garden 2048',         // 앱 이름
  webDir: 'dist/public',          // 빌드 결과 폴더
}
```

### appId 변경 방법
`capacitor.config.ts`에서 `appId` 수정 후:
```bash
pnpm android:sync
```

---

## Capacitor 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `cap add android` | Android 플랫폼 추가 (최초 1회) |
| `cap sync android` | 웹 에셋 + 플러그인 동기화 |
| `cap copy android` | 웹 에셋만 복사 |
| `cap open android` | Android Studio 열기 |
| `cap run android` | 연결된 기기에서 실행 |

---

## 앱 정보

- **App ID**: `com.garden2048.app`
- **App Name**: `Garden 2048`
- **Web Dir**: `dist/public`
- **Capacitor Version**: 7.x
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 35 (Android 15)
