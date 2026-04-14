# ── Migo 앱 ProGuard / R8 rules ──────────────────────────────────

# Capacitor 코어 (크래시 방지)
-keep class com.getcapacitor.** { *; }
-keep class com.lunaticsgroup.migo.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Supabase / Ktor / OkHttp (네트워크)
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.github.jan.supabase.**
-keep class okhttp3.** { *; }
-keepclassmembers class okhttp3.** { *; }
-dontwarn okhttp3.**

# Google Play Billing (@capgo/native-purchases)
-keep class com.revenuecat.** { *; }
-dontwarn com.revenuecat.**
-keep class com.android.billingclient.** { *; }

# Firebase / Google Services (FCM 푸시)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Gson / JSON 직렬화
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# JavaScript Interface (WebView <-> Native 통신)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Enum 보존
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# 스택 트레이스 가독성 (릴리즈에서도 라인 정보 유지)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
