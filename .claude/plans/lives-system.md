# 생명력(Lives) 시스템

## Context
홈 상단에 생명력(❤️)과 코인(🪙) 표시 추가.
게임 실패 시 생명력 -1. 생명력 소진 시 부활/연장 불가 → 코인으로 충전 → 코인 부족 시 골드 구매 유도.

---

## 동작 규칙

| 항목 | 값 |
|---|---|
| 최대 생명력 | 10 |
| 초기 지급 | 5 (최초 설치 시, 기존 유저도 lives=0이면 1회 지급) |
| 차감 시점 | `hasLost = true` 직후 1회 (`lifeSpentRef`로 게임당 중복 방지) |
| 생명력 > 0 | 기존 광고 부활/연장 버튼 유지 |
| 생명력 = 0 | 부활/연장 버튼 숨김 → "❤️ 생명력 충전" 버튼 표시 |
| 충전 | 10 생명력 = 1,000 코인 |
| 코인 부족 | "골드 구매" → `GoldShopModal` |
| Endless 모드 | 생명력 소모 없음 (Stage 모드만) |

### 팝업 흐름
```
게임 실패
  └─ onSpendLife()  (lifeSpentRef로 중복 방지)
       ├─ lives > 0 → GameEndModal  (기존: 광고 부활/연장 버튼)
       └─ lives = 0 → GameEndModal  ("❤️ 생명력 충전" 버튼만)
                          └─ BuyLivesModal
                               ├─ 코인 ≥ 1000 → spendCoins(1000) + addLives(10)
                               │                → 부활 버튼 활성화
                               └─ 코인 < 1000  → GoldShopModal
                                                  (purchaseGoldPack → onEarnCoins)
```

---

## 수정 파일 목록

### 1. `src/utils/playerData.ts`
- `PlayerData` 인터페이스에 `lives: number` 추가
- `MAX_LIVES = 10` 상수 export
- `loadPlayerData()`: `lives: data.lives ?? 0`  (기존 사용자 0으로 마이그레이션)

### 2. `src/hooks/usePlayer.ts`
- `spendLife(): boolean`
  - lives > 0 → `savePlayerData({...player, lives: player.lives - 1})` → `true`
  - lives = 0 → `false`
- `addLives(n: number)`
  - `Math.min(MAX_LIVES, player.lives + n)` 저장
- 반환값에 `spendLife`, `addLives` 추가

### 3. `src/utils/economyUtils.ts`
- 초기 생명력 지급 (기존 `giveInitialGiftIfNeeded`와 별도 키로 관리):
  ```typescript
  const LIVES_GIFT_KEY = "plant2048_lives_init_v1";
  // giveInitialGiftIfNeeded 안에 추가 OR 별도 함수 giveInitialLivesIfNeeded()
  if (!localStorage.getItem(LIVES_GIFT_KEY)) {
    const player = loadPlayerData();
    if (player.lives === 0) {
      savePlayerData({ ...player, lives: 5 });
    }
    localStorage.setItem(LIVES_GIFT_KEY, "1");
  }
  ```
- App.tsx에서 `giveInitialGiftIfNeeded()` 직후 호출

### 4. `src/components/FrontScreen.tsx`
- 기존 디자인 요소 **일절 수정 없음** (CoinDisplay, 메뉴 카드, 타이틀, 스타트 버튼 등 유지)
- 홈 상단 빈 공간(y=0~165 영역)에 **상태 바** 추가

#### 위치 & 레이아웃
```
toRenderPoint(x, 100, bg) 기준 수평 배치
  Lives Badge  ←  x=300, y=100
  Coins Badge  ←  x=820, y=100
```
- 기존 CoinDisplay(840, 390)와 별개로 상단에 추가 (기존 유지)
- y=100 → HomeTitle(y=162) 및 메뉴 카드(y=166~) 위쪽 빈 영역

#### 계절 색상 적용
`SEASON_MENU_PALETTE[season]`의 bg·text·shadow를 사용:
```typescript
const palette = SEASON_MENU_PALETTE[season];
// 배경: palette.bg + "dd" (약 87% 불투명), border: 1px solid with 0.4 alpha
// 문자: palette.text
```
→ 봄: 따뜻한 아이보리 / 여름: 밝은 노랑 / 가을: 소프트 골드 / 겨울: 아이시 화이트

#### Lives Badge 표시 로직
```tsx
const MAX_SLOTS = 5;
const filled = Math.min(lives, MAX_SLOTS);         // 0~5 채워진 하트
const bonus  = Math.max(0, lives - MAX_SLOTS);     // 6~10 시 1~5

// 하트 슬롯 5개 (채움/빔)
{Array.from({length: MAX_SLOTS}, (_, i) =>
  <span key={i} style={{opacity: i < filled ? 1 : 0.25}}>❤️</span>
)}

// 보너스: lives > 5일 때만 표시 (불필요한 "+0" 없음)
{bonus > 0 && <span>+{bonus}</span>}
```

| lives | 표시 |
|---|---|
| 10 | ❤️❤️❤️❤️❤️ +5 |
| 7  | ❤️❤️❤️❤️❤️ +2 |
| 5  | ❤️❤️❤️❤️❤️ (텍스트 없음) |
| 3  | ❤️❤️❤️🤍🤍 (투명도 25%) |
| 0  | 🤍🤍🤍🤍🤍 (전부 투명) |

#### Coins Badge 표시
- 기존 CoinDisplay와 동일 방식: `🪙 {coins.toLocaleString()}`
- 계절 palette.text 색상 사용

#### 글자 크기
- `Math.max(13, 15 * scaleX)` — CoinDisplay(14 * scaleX)보다 약간 크게

### 5. `src/App.tsx`
- `usePlayer()`에서 `spendLife`, `addLives` destructure 추가
- `<Game>` props에 `onSpendLife={spendLife}`, `onAddLives={addLives}` 추가
- `giveInitialGiftIfNeeded()` 아래에 `giveInitialLivesIfNeeded()` 호출 (또는 통합)

### 6. `src/pages/Game.tsx`
- Props 인터페이스 추가:
  ```typescript
  onSpendLife: () => void;
  onAddLives:  (n: number) => void;
  ```
- `lifeSpentRef = useRef(false)` — 게임 리셋/클리어 시 `false`로 초기화
- `hasLost` useEffect (기존 line ~268) 내:
  ```typescript
  if (hasLost && !lifeSpentRef.current && isActive) {
    lifeSpentRef.current = true;
    onSpendLife();
  }
  ```
- `showBuyLivesModal: boolean` 상태 추가
- `handleBuyLives()` → `setShowBuyLivesModal(true)`
- `handleBuyLivesWithCoins()`:
  ```typescript
  if (onSpendCoins(1000)) { onAddLives(10); setShowBuyLivesModal(false); }
  ```
- GameEndModal에 `lives={player.lives}`, `onBuyLives={handleBuyLives}` prop 추가
- 포털로 `BuyLivesModal`, `GoldShopModal` 렌더링 추가

### 7. `src/components/GameEndModal.tsx`
- Props 추가: `lives?: number`, `onBuyLives?: () => void`
- `const livesEmpty = typeof lives === "number" && lives <= 0;`
- `onRevive` 버튼 조건: `!isWin && onRevive && !livesEmpty && reviveAd !== "done"`
- `onExtendTurns` 버튼 조건: `!isWin && onExtendTurns && !livesEmpty && reviveAd !== "done"`
- `livesEmpty=true` 시 "❤️ 생명력 충전" 버튼 표시:
  ```tsx
  {livesEmpty && onBuyLives && (
    <button onClick={onBuyLives} className="gradient-red ...">
      ❤️ 생명력 충전하기
    </button>
  )}
  ```

### 8. 신규: `src/components/modals/BuyLivesModal.tsx`
- `BaseModal` 기반 (기존 모달 패턴 재사용)
- Props: `coins: number`, `onBuyWithCoins()`, `onBuyWithGold()`, `onClose()`
- 레이아웃:
  - 헤더: `❤️ 생명력 충전`
  - 설명: `10 생명력 = 1,000 🪙`
  - 현재 코인: `보유 코인: {coins.toLocaleString()} 🪙`
  - 버튼1 (coins ≥ 1000, 활성/green): `1,000 🪙 으로 충전하기`
  - 버튼1 (coins < 1000, 비활성): `코인 부족 (${coins}/1,000)`
  - 버튼2 (항상/amber): `💰 골드 구매하기`

### 9. 신규: `src/components/modals/GoldShopModal.tsx`
- `GOLD_SHOP_ITEMS` (shopData.ts) 리스트 표시
- 각 팩: 금액·가격 + "구매" 버튼
- `purchaseGoldPack(id)` → 성공 시 `onEarnCoins(amount)`
  *(현재 mock 800ms — 향후 Capacitor IAP 교체)*
- Props: `onEarnCoins(n: number)`, `onClose()`

### 10. i18n: `src/i18n/locales/ko.json` + `en.json`
```json
"lives": {
  "label":       "생명력",
  "chargeTitle": "생명력 충전",
  "cost":        "10 생명력 = 1,000 🪙",
  "currentCoins":"보유 코인",
  "buyWithCoins":"🪙 코인으로 충전하기",
  "noCoins":     "코인이 부족합니다",
  "buyGold":     "💰 골드 구매하기",
  "chargeBtn":   "❤️ 생명력 충전하기"
}
```

---

## 데이터 흐름
```
App.tsx
  usePlayer() → { player.lives, spendLife, addLives }
  <FrontScreen player={player} />          ← player.lives 자동 포함
  <Game onSpendLife={spendLife}
        onAddLives={addLives}
        player={player} />
    hasLost → onSpendLife() → lives 감소
    → GameEndModal(lives=player.lives)
        lives=0 → BuyLivesModal
                    코인 충분 → spendCoins(1000) + addLives(10)
                               → 부활 버튼 활성화
                    코인 부족 → GoldShopModal → purchaseGoldPack → onEarnCoins
```

---

## 검증 시나리오
1. `npx tsc --noEmit` → 0 에러 / `npm run build` 정상
2. DEV Reset → lives=0 → App 실행 → `giveInitialLivesIfNeeded()` → lives=5 홈 표시
3. 게임 실패 → 홈 복귀 후 lives -1 확인 (한 게임에서 1회만)
4. lives=0 → 실패 → 부활/연장 버튼 없음, "❤️ 생명력 충전" 버튼만 표시
5. 코인 ≥ 1000 → 충전 → lives=10, coins-1000 확인
6. 코인 < 1000 → "골드 구매" 버튼 표시, GoldShopModal 오픈
7. Endless 모드 실패 → lives 변화 없음
