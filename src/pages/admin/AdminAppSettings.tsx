import { useState, useEffect } from "react";
import {
  Settings, Save, RefreshCw, ToggleLeft, ToggleRight,
  Shield, Zap, Globe, Bell, DollarSign, Users, Plus, Trash2, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAppSettings, updateAppSetting } from "@/lib/adminService";
import { useTranslation } from "react-i18next";

type SettingGroup = {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  settings: SettingDef[];
};

type SettingDef = {
  key: string;
  label: string;
  description?: string;
  type: "boolean" | "number" | "text" | "json";
  defaultValue: any;
};

const SETTING_GROUPS: SettingGroup[] = [
  {
    key: "core",
    label: "앱 핵심 설정",
    description: "앱의 기본 동작 방식",
    icon: Zap,
    color: "from-violet-500 to-purple-600",
    settings: [
      { key: "maintenance_mode", label: "유지보수 모드", description: "활성화 시 앱이 점검 중 화면을 표시합니다", type: "boolean", defaultValue: false },
      { key: "registration_enabled", label: "신규 가입 허용", description: "비활성화 시 신규 회원 가입을 막습니다", type: "boolean", defaultValue: true },
      { key: "discovery_enabled", label: "스와이프 탐색 활성화", description: "매칭 카드 스와이프 기능 On/Off", type: "boolean", defaultValue: true },
    ]
  },
  {
    key: "subscription",
    label: "구독 & 결제 설정",
    description: "플랜 및 가격 관련 설정",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-600",
    settings: [
      { key: "plus_price_krw", label: "Plus 요금 (원)", description: "월 구독 가격", type: "number", defaultValue: 9900 },
      { key: "premium_price_krw", label: "Premium 요금 (원)", description: "월 구독 가격", type: "number", defaultValue: 19900 },
      { key: "free_super_likes", label: "무료 슈퍼라이크 개수", description: "신규 유저 슈퍼라이크 기본 지급량", type: "number", defaultValue: 3 },
      { key: "trial_days", label: "체험 기간 (일)", description: "신규 가입자 무료 체험 일수", type: "number", defaultValue: 1 },
    ]
  },
  {
    key: "safety",
    label: "안전 & 보안 설정",
    description: "유저 보호 및 보안 관련",
    icon: Shield,
    color: "from-red-500 to-rose-600",
    settings: [
      { key: "sos_alert_enabled", label: "SOS 긴급 알림", description: "SOS 체크인 발생 시 어드민에게 알림", type: "boolean", defaultValue: true },
      { key: "auto_ban_no_show", label: "노쇼 자동 정지", description: "노쇼 3회 이상 시 자동 계정 정지", type: "boolean", defaultValue: false },
      { key: "report_threshold", label: "자동 정지 신고 수", description: "신고 N건 이상 시 자동으로 검토 대상", type: "number", defaultValue: 5 },
    ]
  },
  {
    key: "matching",
    label: "매칭 알고리즘 설정",
    description: "스와이프 및 매칭 동작 방식",
    icon: Users,
    color: "from-pink-500 to-rose-500",
    settings: [
      { key: "match_radius_km", label: "기본 탐색 반경 (km)", description: "근처 유저 탐색 기본 반경", type: "number", defaultValue: 50 },
      { key: "daily_swipe_limit_free", label: "무료 일일 스와이프 한도", type: "number", defaultValue: 20 },
      { key: "daily_swipe_limit_plus", label: "Plus 일일 스와이프 한도", type: "number", defaultValue: 100 },
      { key: "boost_duration_minutes", label: "부스트 지속 시간 (분)", type: "number", defaultValue: 30 },
    ]
  },
  {
    key: "notifications",
    label: "알림 설정",
    description: "FCM 푸시 알림 관련",
    icon: Bell,
    color: "from-blue-500 to-cyan-500",
    settings: [
      { key: "push_match_enabled", label: "매칭 푸시 알림", type: "boolean", defaultValue: true },
      { key: "push_message_enabled", label: "메시지 푸시 알림", type: "boolean", defaultValue: true },
      { key: "push_marketing_enabled", label: "마케팅 푸시 허용", type: "boolean", defaultValue: true },
    ]
  },
  {
    key: "localization",
    label: "언어 & 지역 설정",
    description: "지원 언어 및 지역 관련",
    icon: Globe,
    color: "from-amber-500 to-orange-500",
    settings: [
      { key: "default_language", label: "기본 언어", type: "text", defaultValue: "ko" },
      { key: "supported_currencies", label: "지원 통화", type: "text", defaultValue: "KRW,USD,JPY" },
      { key: "supported_countries", label: "서비스 국가 코드", description: "쉼표로 구분", type: "text", defaultValue: "KR,JP,TH,VN,SG" },
    ]
  },
];

export const AdminAppSettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true, subscription: true
  });
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customKeys, setCustomKeys] = useState<Array<{ key: string; value: any }>>([]);

  const load = async () => {
    setLoading(true);
    const data = await fetchAppSettings();
    setSettings(data);
    // Extract custom keys (not in predefined)
    const allPredefined = SETTING_GROUPS.flatMap(g => g.settings.map(s => s.key));
    const extras = Object.entries(data)
      .filter(([k]) => !allPredefined.includes(k))
      .map(([key, value]) => ({ key, value }));
    setCustomKeys(extras);
    setLoading(false);
    setDirty({});
  };

  useEffect(() => { load(); }, []);

  const getValue = (def: SettingDef) => {
    if (settings[def.key] !== undefined) return settings[def.key];
    return def.defaultValue;
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(prev => ({ ...prev, [key]: true }));
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    await updateAppSetting(key, settings[key]);
    setSaving(null);
    setDirty(prev => ({ ...prev, [key]: false }));
  };

  const handleAddCustom = async () => {
    if (!customKey.trim()) return;
    let parsed: any = customValue;
    try { parsed = JSON.parse(customValue); } catch {}
    await updateAppSetting(customKey.trim(), parsed);
    setCustomKeys(prev => [...prev.filter(c => c.key !== customKey.trim()), { key: customKey.trim(), value: parsed }]);
    setSettings(prev => ({ ...prev, [customKey.trim()]: parsed }));
    setCustomKey("");
    setCustomValue("");
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const handleDeleteCustom = async (key: string) => {
    if (confirmDeleteId !== key) {
      setConfirmDeleteId(key);
      setTimeout(() => setConfirmDeleteId(prev => prev === key ? null : prev), 3000);
      return;
    }
    setConfirmDeleteId(null);
    await updateAppSetting(key, null);
    setCustomKeys(prev => prev.filter(c => c.key !== key));
    setSettings(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleGroup = (key: string) =>
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Settings size={24} className="text-primary" /> {t("auto.t_app_settings_title", "앱 설정")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auto.t_app_settings_desc", "앱 전역 설정을 관리합니다. 변경사항은 즉시 반영됩니다.")}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t("auto.t_refresh", "새로고침")}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Setting Groups */}
          {SETTING_GROUPS.map(group => (
            <div key={group.key} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center shrink-0`}>
                  <group.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-foreground">{group.label}</p>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${expandedGroups[group.key] ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expandedGroups[group.key] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border/50">
                      {group.settings.map(def => {
                        const val = getValue(def);
                        const isDirty = dirty[def.key];
                        const isSaving = saving === def.key;

                        return (
                          <div key={def.key} className="px-5 py-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{def.label}</p>
                              {def.description && <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>}
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{def.key}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {def.type === "boolean" ? (
                                <button
                                  onClick={() => handleChange(def.key, !val)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    val ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {val ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                  {val ? "ON" : "OFF"}
                                </button>
                              ) : def.type === "number" ? (
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => handleChange(def.key, Number(e.target.value))}
                                  className="w-24 px-3 py-1.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary text-right"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={e => handleChange(def.key, e.target.value)}
                                  className="w-36 px-3 py-1.5 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary"
                                />
                              )}

                              <button
                                onClick={() => handleSave(def.key)}
                                disabled={!isDirty || isSaving}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  isDirty
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                                }`}
                              >
                                {isSaving ? (
                                  <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Save size={12} />
                                )}
                                {t("auto.t_save", "저장")}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Custom Keys */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-extrabold text-foreground flex items-center gap-2">
                <Settings size={16} className="text-muted-foreground" />
                {t("auto.t_custom_settings", "커스텀 설정값")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{t("auto.t_custom_settings_desc", "직접 키-값 쌍을 추가합니다")}</p>
            </div>

            {/* Add new */}
            <div className="p-5 border-b border-border bg-muted/20">
              <div className="flex gap-2">
                <input
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  placeholder={t("auto.t_custom_key_ph", "키 이름 (ex: feature_flag_x)")}
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary font-mono"
                />
                <input
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder={t("auto.t_custom_val_ph", '값 (ex: true, 42, "text")')}
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customKey.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center gap-2"
                >
                  <Plus size={14} /> {t("auto.t_custom_add", "추가")}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-border/50">
              {customKeys.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("auto.t_custom_empty", "커스텀 설정이 없습니다")}</div>
              ) : customKeys.map(({ key, value }) => (
                <div key={key} className="px-5 py-3.5 flex items-center gap-3">
                  <code className="text-xs font-mono text-primary flex-1">{key}</code>
                  <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                  <button
                    onClick={() => handleDeleteCustom(key)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${confirmDeleteId === key ? "bg-red-500 text-white" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}
                    title={confirmDeleteId === key ? "한 번 더 눌러 삭제" : "삭제"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAppSettings;
