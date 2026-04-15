/* ============================================================
 * googlePlay.ts
 * Google Play Games Services 연동 Mock + 통합 포인트
 *
 * 📱 Android/Google Play 출시 후 연결 포인트:
 *   1. Capacitor + @capacitor-community/google-play-games-services 플러그인
 *      또는 React Native + react-native-google-signin 사용
 *   2. 아래 함수들의 mock 코드를 실제 GPGS API 호출로 교체
 *   3. LEADERBOARD_ID_* 상수를 Google Play Console 리더보드 ID로 변경
 * ============================================================ */

export interface GooglePlayProfile {
  id:          string;
  displayName: string;
  email?:      string;
  photoUrl?:   string;
}

export interface GoogleAuthState {
  connected: boolean;
  profile:   GooglePlayProfile | null;
  loading:   boolean;
}

/* ── Google Play 리더보드 ID ─────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Google Play Console → 게임 서비스 → 리더보드 메뉴에서 생성 후 ID 복사
 * ──────────────────────────────────────────────────────────── */
export const LEADERBOARD_ID_DAILY  = "CgkI__DAILY__LEADERBOARD";   // TODO: 실제 ID로 교체
export const LEADERBOARD_ID_WEEKLY = "CgkI__WEEKLY__LEADERBOARD";  // TODO: 실제 ID로 교체
export const LEADERBOARD_ID_ALL    = "CgkI__ALLTIME__LEADERBOARD"; // TODO: 실제 ID로 교체

/* ── 업적 ID ─────────────────────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Google Play Console → 게임 서비스 → 업적 메뉴에서 생성 후 ID 복사
 * ──────────────────────────────────────────────────────────── */
export const ACHIEVEMENT_FIRST_GAME = "CgkI__ACHIEVEMENT_FIRST"; // TODO
export const ACHIEVEMENT_REACH_1024 = "CgkI__ACHIEVEMENT_1024";  // TODO
export const ACHIEVEMENT_REACH_2048 = "CgkI__ACHIEVEMENT_2048";  // TODO

const GOOGLE_AUTH_KEY = "plant2048_google_auth";

/* ── localStorage에서 연동 상태 로드 ───────────────────────── */
export const loadGoogleAuthState = (): GoogleAuthState => {
  try {
    const raw = localStorage.getItem(GOOGLE_AUTH_KEY);
    if (!raw) return { connected: false, profile: null, loading: false };
    const stored = JSON.parse(raw) as Partial<GoogleAuthState>;
    return {
      connected: stored.connected ?? false,
      profile:   stored.profile   ?? null,
      loading:   false,
    };
  } catch {
    return { connected: false, profile: null, loading: false };
  }
};

const saveGoogleAuthState = (state: Omit<GoogleAuthState, "loading">): void => {
  try {
    localStorage.setItem(GOOGLE_AUTH_KEY, JSON.stringify(state));
  } catch { /* noop */ }
};

/* ── Google 계정 연결 (Mock) ─────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Capacitor:
 *     import { GooglePlayGamesServices } from '@capacitor-community/google-play-games-services';
 *     const profile = await GooglePlayGamesServices.signIn();
 *
 *   React Native:
 *     import { GoogleSignin } from '@react-native-google-signin/google-signin';
 *     const userInfo = await GoogleSignin.signIn();
 * ──────────────────────────────────────────────────────────── */
export const connectGoogleAccount = async (): Promise<GooglePlayProfile> => {
  /* TODO: 실제 GPGS/OAuth 호출로 교체 */
  await new Promise((r) => setTimeout(r, 900)); // mock 네트워크 지연

  const mockProfile: GooglePlayProfile = {
    id:          `mock_user_${Date.now()}`,
    displayName: "식물 플레이어",
    email:       "player@example.com",
    photoUrl:    undefined,
  };

  saveGoogleAuthState({ connected: true, profile: mockProfile });
  return mockProfile;
};

/* ── Google 계정 연결 해제 (Mock) ───────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Capacitor: await GooglePlayGamesServices.signOut();
 *   React Native: await GoogleSignin.signOut();
 * ──────────────────────────────────────────────────────────── */
export const disconnectGoogleAccount = async (): Promise<void> => {
  /* TODO: 실제 GPGS 로그아웃으로 교체 */
  await new Promise((r) => setTimeout(r, 400));
  saveGoogleAuthState({ connected: false, profile: null });
};

/* ── 프로필 조회 (Mock) ──────────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Capacitor: const profile = await GooglePlayGamesServices.getPlayerProfile();
 * ──────────────────────────────────────────────────────────── */
export const getGooglePlayProfile = async (): Promise<GooglePlayProfile | null> => {
  const state = loadGoogleAuthState();
  return state.profile;
};

/* ── 리더보드 열기 (Mock) ────────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Capacitor: await GooglePlayGamesServices.showLeaderboard({ leaderboardID: id });
 * ──────────────────────────────────────────────────────────── */
export const openLeaderboard = (_leaderboardId: string): void => {
  /* TODO: 실제 GPGS 리더보드 UI 호출로 교체 */
  console.info("[GPGS Mock] openLeaderboard:", _leaderboardId);
};

/* ── 업적 화면 열기 (Mock) ───────────────────────────────────
 * 📱 [GPGS 연결 포인트]
 *   Capacitor: await GooglePlayGamesServices.showAchievements();
 * ──────────────────────────────────────────────────────────── */
export const openAchievements = (): void => {
  /* TODO: 실제 GPGS 업적 UI 호출로 교체 */
  console.info("[GPGS Mock] openAchievements");
};

/* ── 점수 제출 (Mock) ────────────────────────────────────────
 * 게임 종료 시 호출 — 나중에 실제 GPGS 제출로 교체
 *
 * 📱 [GPGS 연결 포인트]
 *   Capacitor: await GooglePlayGamesServices.submitScore({
 *     leaderboardID: id,
 *     score: value,
 *   });
 * ──────────────────────────────────────────────────────────── */
export const submitScoreToLeaderboard = async (
  _leaderboardId: string,
  _score: number,
): Promise<void> => {
  /* TODO: 실제 GPGS 점수 제출로 교체 */
  console.info("[GPGS Mock] submitScore:", _leaderboardId, _score);
};
