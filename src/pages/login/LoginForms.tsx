import i18n from "@/i18n";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock, Phone, AlertCircle, Shield, Check, X, Plus } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// ─── Constants for the forms ───
const GLOBAL_DIAL_CODES = ["+82 🇰🇷", "+1 🇺🇸", "+1 🇨🇦", "+44 🇬🇧", "+61 🇦🇺", "+81 🇯🇵", "+86 🇨🇳", "+49 🇩🇪", "+33 🇫🇷", "+39 🇮🇹", "+34 🇪🇸", "+7 🇷🇺", "+55 🇧🇷", "+52 🇲🇽", "+91 🇮🇳", "+62 🇮🇩", "+90 🇹🇷", "+27 🇿🇦", "+54 🇦🇷", "+56 🇨🇱", "+57 🇨🇴", "+51 🇵🇪", "+66 🇹🇭", "+84 🇻🇳", "+60 🇲🇾", "+63 🇵🇭", "+65 🇸🇬", "+886 🇹🇼", "+852 🇭🇰", "+853 🇲🇴", "+971 🇦🇪", "+966 🇸🇦", "+972 🇮🇱", "+20 🇪🇬", "+212 🇲🇦", "+234 🇳🇬", "+254 🇰🇪", "+46 🇸🇪", "+47 🇳🇴", "+45 🇩🇰", "+358 🇫🇮", "+31 🇳🇱", "+32 🇧🇪", "+41 🇨🇭", "+43 🇦🇹", "+48 🇵🇱", "+420 🇨🇿", "+36 🇭🇺", "+30 🇬🇷", "+351 🇵🇹", "+353 🇮🇪", "+64 🇳🇿", "+53 🇨🇺", "+593 🇪🇨", "+598 🇺🇾", "+58 🇻🇪", "+506 🇨🇷"];

// Animation variants
export const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.25 }
};

// ─── STEP 0: PURPOSE ───
export const SignupStep0 = ({ signupPurpose, setSignupPurpose, PURPOSE_OPTIONS }: any) => {
  return (
    <motion.div key="step0" className="px-6 pt-4 pb-4 space-y-3" {...stepVariants}>
      {PURPOSE_OPTIONS.map((opt: any) => (
        <motion.button
          key={opt.id}
          onClick={() => setSignupPurpose(opt.id)}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${signupPurpose === opt.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-xl shrink-0`}>
            {opt.emoji}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{opt.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
          {signupPurpose === opt.id && <Check size={18} className="text-primary ml-auto shrink-0" />}
        </motion.button>
      ))}
    </motion.div>
  );
};

// ─── STEP 1: ACCOUNT ───
export const SignupStep1 = ({ props }: any) => {
  const { name, setName, email, setEmail, age, setAge, gender, setGender, nationality, setNationality, NATIONALITIES, password, setPassword, showPass, setShowPass, pwStrength, confirmPassword, setConfirmPassword, showConfirmPass, setShowConfirmPass, t } = props;
  
  return (
    <motion.div key="step1" className="px-6 pt-2 pb-6 space-y-4" {...stepVariants}>
      <div>
        <label className="text-xs font-bold text-foreground mb-1.5 block">{i18n.t("auto.g_1413", "이름 (실명)")}</label>
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
          <User size={16} className="text-muted-foreground shrink-0" />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={i18n.t("auto.g_1414", "홍길동")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-foreground mb-1.5 block">{t('login.email') || i18n.t("auto.g_1415", "이메일")}</label>
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@lunaticsgroup.com" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-foreground mb-1.5 block">{t('login.age') || i18n.t("auto.g_1416", "나이")}</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} min={18} max={99} placeholder="25" className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-bold text-foreground mb-1.5 block">{i18n.t("auto.g_1417", "성별")}</label>
          <div className="flex gap-1.5 truncate">
            {[i18n.t("auto.g_1418", "남성"), i18n.t("auto.g_1419", "여성"), i18n.t("auto.g_1420", "기타")].map((g: string) => (
              <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${gender === g ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-foreground mb-1.5 block">{t('login.nationality') || i18n.t("auto.g_1421", "국적")}</label>
        <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none bg-none">
          {NATIONALITIES.map((n: string) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="truncate">
        <label className="text-xs font-bold text-foreground mb-1.5 block">{i18n.t("auto.g_1422", "비밀번호")}</label>
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-2">
          <Lock size={16} className="text-muted-foreground shrink-0" />
          <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={i18n.t("auto.g_1423", "8자 이상 영문/숫자 조합")} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button onClick={() => setShowPass(!showPass)} className="shrink-0">
            {showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwStrength.level ? pwStrength.color : "bg-muted"}`} />
              ))}
            </div>
            <p className={`text-[10px] font-semibold ${pwStrength.level >= 3 ? "text-emerald-500" : "text-amber-500"}`}>{i18n.t("login." + pwStrength.label)}</p>
          </div>
        )}
      </div>
      <div className="truncate">
        <label className="text-xs font-bold text-foreground mb-1.5 block">{t('login.passwordConfirm')}</label>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${confirmPassword && password !== confirmPassword ? "bg-red-500/10 border border-red-500/30" : "bg-muted"}`}>
          <Lock size={16} className="text-muted-foreground shrink-0" />
          <input type={showConfirmPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('login.passwordConfirmPlaceholder')} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="shrink-0">
            {showConfirmPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && <p className="text-[10px] text-red-500 mt-1 font-semibold truncate">{i18n.t("auto.g_1424", "비밀번호가 서로 일치하지 않습니다.")}</p>}
      </div>
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
        <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed truncate">{i18n.t("auto.g_1425", "영문, 숫자, 특수문자를 혼합해욱 안전하게 만들 수 있습니다.")}</p>
      </div>
    </motion.div>
  );
};

// ─── STEP 2: PHONE OTP (Twilio) ───
export const SignupStep2 = ({ props }: any) => {
  const { phoneCountry, setPhoneCountry, phone, setPhone, otpVerified, sendOtp, otpLoading, otpSent, otpTimeout, otp, setOtp, verifyOtp, t } = props;

  return (
    <motion.div key="step2" className="px-6 pt-2 pb-6 space-y-4" {...stepVariants}>
      <div className="flex items-center justify-center mb-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Phone size={28} className="text-primary" />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-foreground mb-1.5 block">{i18n.t("auto.g_1426", "휴대폰 번호")}</label>
        <div className="flex gap-2">
          <select value={phoneCountry} onChange={e => setPhoneCountry(e.target.value)} disabled={otpVerified} className="bg-muted rounded-2xl px-3 py-3 text-sm font-bold text-foreground outline-none shrink-0">
            {GLOBAL_DIAL_CODES.map(c => {
              const code = c.split(" ")[0];
              return <option key={code} value={code}>{c}</option>;
            })}
          </select>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" disabled={otpVerified} className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
        </div>
      </div>

      {!otpVerified && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={sendOtp}
          disabled={otpLoading}
          className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-card disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {otpLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {otpSent ? t('login.resendOtp') : t('login.sendOtp')}
        </motion.button>
      )}

      {otpSent && !otpVerified && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">{i18n.t("auto.g_1427", "인증번호 (6자리)")}</label>
              <span className={`text-xs font-mono font-bold ${otpTimeout < 30 ? "text-red-500" : "text-muted-foreground"}`}>
                {String(Math.floor(otpTimeout / 60)).padStart(2, "0")}:{String(otpTimeout % 60).padStart(2, "0")}
              </span>
            </div>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-[0.3em] font-mono text-base" />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={verifyOtp}
            disabled={otpLoading}
            className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {otpLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {i18n.t("verif.checkDone")}
          </motion.button>
        </motion.div>
      )}

      {otpVerified && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground truncate">{i18n.t("auto.g_1428", "전화번호 인증")}</p>
            <p className="text-xs text-muted-foreground truncate">{phoneCountry} {phone} {i18n.t("auto.g_1429", "인증됨")}</p>
          </div>
        </motion.div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <Shield size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed truncate">{i18n.t("login.phoneNotice")}</p>
      </div>
    </motion.div>
  );
};

// ─── STEP 3: SAFETY AGREEMENTS ───
export const SignupStep3 = ({ props }: any) => {
  const { allAgree, setAllAgree, agreements } = props;
  
  return (
    <motion.div key="step3" className="px-6 pt-2 pb-6 space-y-3" {...stepVariants}>
      <div className="flex items-center justify-center mb-1">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield size={28} className="text-primary" />
        </div>
      </div>
      <button onClick={() => setAllAgree(!allAgree)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${allAgree ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${allAgree ? "gradient-primary" : "border-2 border-border"}`}>
          {allAgree && <Check size={14} className="text-primary-foreground" />}
        </div>
        <span className="font-extrabold text-sm text-foreground truncate">{i18n.t("auto.g_1430", "아래 약관에 모두 동의합니다")}</span>
      </button>
      <div className="w-full h-px bg-border" />
      {agreements.map(({ key, value, set, label, sub, required }: any) => (
        <button key={key} onClick={() => set(!value)} className="w-full flex items-center gap-3 py-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${value ? "gradient-primary" : "border-2 border-border"}`}>
            {value && <Check size={11} className="text-primary-foreground" />}
          </div>
          <div className="flex-1 text-left">
            <p className={`text-sm font-semibold ${required ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </button>
      ))}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20">
        <Shield size={13} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed truncate">
          {i18n.t("auto.g_1431", "만 18세 미만의 미성년자는 가입이 불가능합니다.")}
          <span className="font-bold text-primary truncate">{i18n.t("auto.g_1432", "신원 인증된 회원")}</span>
          {i18n.t("auto.g_1433", "만 안전하게 이용할 수 있도록 보안 정책을 강화하고 있습니다.")}
        </p>
      </div>
    </motion.div>
  );
};

// ─── STEP 4: TRAVEL PROFILE ───
export const SignupStep4 = ({ props }: any) => {
  const { profilePhotos, MAX_PHOTOS, removePhoto, fileRef, handlePhotoAdd, bio, setBio, TRAVEL_STYLES, selectedStyles, toggleItem, setSelectedStyles, LANGUAGES, selectedLangs, setSelectedLangs, REGIONS, selectedRegions, setSelectedRegions } = props;

  return (
    <motion.div key="step4" className="px-6 pt-2 pb-6 space-y-5" {...stepVariants}>
      {/* 프로필 사진 최대 6장 */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 block">
          {i18n.t("auto.g_1434", "프로필 사진")}{" "}
          <span className="text-red-500 font-bold text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded-full truncate">{i18n.t("auto.g_1435", "필수")}</span>{" "}
          <span className="text-muted-foreground font-normal truncate">({profilePhotos.length}/{MAX_PHOTOS}{i18n.t("auto.g_1436", "장")})</span>
        </label>
        <div className="grid grid-cols-3 gap-2 truncate">
          {profilePhotos.map((photo: any, idx: number) => (
            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border truncate">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.5 rounded-full truncate">{i18n.t("auto.g_1437", "대표")}</div>}
              <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          {profilePhotos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-muted transition-colors hover:bg-muted/70"
            >
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">{i18n.t("auto.g_1438", "사진 추가")}</span>
            </button>
          )}
        </div>
        <input ref={fileRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
        <p className="text-[10px] text-muted-foreground mt-2 truncate">{i18n.t("auto.g_1439", "가장 멋진 사진을 첫 번째 메인 사진에 배치해보세요.")}</p>
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-bold text-foreground mb-1.5 block">{i18n.t("auto.g_1440", "한 줄 소개")}</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={100} rows={2} placeholder={i18n.t("auto.g_1441", "나의 매력을 보여줄 수 있는 짧은 소개글을 남겨주세요!")} className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Travel styles */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.g_1442", "나의 여행 스타일 ")}<span className="text-muted-foreground font-normal truncate">{i18n.t("auto.g_1443", "(다중 선택 가능)")}</span></label>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_STYLES.map((s: string) => (
            <button key={s} onClick={() => toggleItem(s, selectedStyles, setSelectedStyles)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedStyles.includes(s) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.g_1444", "사용 가능한 언어")}</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l: string) => (
            <button key={l} onClick={() => toggleItem(l, selectedLangs, setSelectedLangs)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedLangs.includes(l) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div>
        <label className="text-xs font-bold text-foreground mb-2 block">{i18n.t("auto.g_1445", "관심 있는 지역")}</label>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r: string) => (
            <button key={r} onClick={() => toggleItem(r, selectedRegions, setSelectedRegions)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedRegions.includes(r) ? "gradient-primary text-primary-foreground shadow-card" : "bg-muted text-muted-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── LOGIN FORM ───
export const LoginForm = ({ props }: any) => {
  const { email, setEmail, password, setPassword, showPass, setShowPass, navigate, t } = props;

  return (
    <motion.div key="login" className="px-6 pt-2 pb-6 space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
      <div>
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3 mb-3">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.email')} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
          <Lock size={16} className="text-muted-foreground shrink-0" />
          <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password')} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
          </button>
        </div>
      </div>
      <button
        onClick={() => navigate("/find-account", { state: { tab: "password" } })}
        className="text-xs text-primary font-semibold text-right w-full"
      >
        {t('login.forgotPass')}
      </button>

      <div className="space-y-2 pt-2">
        <p className="text-[10px] text-center text-muted-foreground truncate">{t('login.orSocial')}</p>

        {/* Google OAuth — Custom Tab / SFSafariViewController (앱 내 처리) */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            try {
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: Capacitor.isNativePlatform()
                    ? 'migoapp://login-callback'
                    : `${window.location.origin}/auth/callback`,
                  skipBrowserRedirect: true, // 수동으로 인앱 브라우저 열기
                }
              });
              if (error) {
                toast({ title: i18n.t("auto.g_0052", "구글 로그인 오류"), description: error.message, variant: "destructive" });
              } else if (data?.url) {
                // SFSafariViewController (iOS) / Chrome Custom Tab (Android)
                await Browser.open({ url: data.url, presentationStyle: 'popover' });
              }
            } catch (e: any) {
              toast({ title: i18n.t("auto.g_0052", "구글 로그인 오류"), description: e?.message, variant: "destructive" });
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform bg-card border border-border text-foreground"
        >
          <span>🔵</span> {i18n.t("login.google")}
        </motion.button>

        {/* Sign in with Apple — Guideline 4.8 필수 구현 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            try {
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "apple",
                options: {
                  redirectTo: Capacitor.isNativePlatform()
                    ? 'migoapp://login-callback'
                    : `${window.location.origin}/auth/callback`,
                  skipBrowserRedirect: true, // 수동으로 인앱 브라우저 열기
                }
              });
              if (error) {
                toast({ title: i18n.t("login.apple"), description: error.message, variant: "destructive" });
              } else if (data?.url) {
                // SFSafariViewController (iOS) / Chrome Custom Tab (Android)
                await Browser.open({ url: data.url, presentationStyle: 'popover' });
              }
            } catch (e: any) {
              toast({ title: i18n.t("login.apple"), description: e?.message, variant: "destructive" });
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-sm transition-transform bg-foreground text-background"
        >
          <span>🍎</span> {i18n.t("login.apple")}
        </motion.button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 mt-4">
        <Shield size={13} className="text-primary shrink-0" />
        <p className="text-[10px] text-muted-foreground truncate">{t('login.sslNote')}</p>
      </div>
    </motion.div>
  );
};
