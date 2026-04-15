# ════════════════════════════════════════════════════════════════
#  Garden 2048 — Proguard / R8 Rules
#  ※ Capacitor + WebView 기반이므로 일반 Android 앱과 다른 설정 필요
# ════════════════════════════════════════════════════════════════

# ─── 스택 트레이스 디버깅용 (Play Console 크래시 분석에 필수) ───
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ─── Capacitor Core ──────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.NativePlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod *;
}

# ─── WebView JavaScript Interface ────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ─── Capacitor Cordova Plugin Bridge ─────────────────────────────
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }

# ─── AndroidX 기본 보호 ──────────────────────────────────────────
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }

# ─── AdMob (추후 @capacitor-community/admob 도입 시 자동 적용됨) ─
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# ─── Google Sign-In (추후 capacitor-google-auth 도입 시) ─────────
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# ─── Reflective 접근 대비 — 빈 생성자 유지 ───────────────────────
-keepclassmembers class * { public <init>(); }

# ─── Play Core (필요 시 in-app review 등) ────────────────────────
-keep class com.google.android.play.core.** { *; }
