import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import siteLogo from "@/assets/site-logo.png";
import { Shield, MapPin, Sparkles, LogIn, ChevronRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-y-auto">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/40 z-40">
        <div className="flex items-center gap-2">
          <img src={siteLogo} alt="MIGO Logo" className="h-8 object-contain" />
          <span className="font-extrabold text-xl tracking-tight">MIGO</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          {t('login.login', 'Log In')}
        </button>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 py-20 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full mb-6 inline-block truncate">
              {t('landing.heroBadge', 'Premium Globetrotter Matching')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 truncate">
              {t('landing.heroTitle1', 'Find Your Perfect')}{' '}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 truncate">
                {t('landing.heroTitle2', 'Travel Companion')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed truncate">
              {t('landing.heroDesc', 'MIGO connects travelers worldwide based on location, verified profiles, and automated AI trip planning. Travel safer, smarter, and together.')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/onboarding")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-base shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {t('landing.heroBtn', 'Get Started')} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-center mb-12 truncate">{t('landing.featuresTitle', 'Core Features')}</h2>
            <div className="grid md:grid-cols-3 gap-8 truncate">
              {[
                {
                  icon: MapPin,
                  title: t('landing.feature1Title', 'Location-Based Matches'),
                  desc: t('landing.feature1Desc', 'Discover travelers near you or at your future destination using secure location mapping.')
                },
                {
                  icon: Sparkles,
                  title: t('landing.feature2Title', 'AI Trip Planner'),
                  desc: t('landing.feature2Desc', 'Generate full travel itineraries with our advanced AI integrations in seconds.')
                },
                {
                  icon: Shield,
                  title: t('landing.feature3Title', 'Verified Community'),
                  desc: t('landing.feature3Desc', "Rigorous profile verification ensures you're meeting real, trusted globetrotters.")
                }
              ].map((f, i) => (
                <div key={i} className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col items-start">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-5">
                    <f.icon size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OAuth / Data Statement Section (Crucial for Verification) */}
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto bg-card p-8 md:p-10 rounded-3xl border border-border shadow-md">
            <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2 truncate">
              <Shield className="text-emerald-500" size={28} />
              {t('landing.dataTitle', 'Why We Request Your Data')}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed truncate">
              {t('landing.dataDesc', 'MIGO is committed to protecting your privacy. We request specific data through Google OAuth solely to provide a secure and personalized travel matching experience. We do not sell your personal data.')}
            </p>

            <div className="space-y-6 truncate">
              {[
                {
                  label: t('landing.data1Label', 'Authentication & Security'),
                  text: t('landing.data1Text', 'We use your Google Account strictly to verify your identity, prevent fake accounts, and securely log you into the application without passwords.')
                },
                {
                  label: t('landing.data2Label', 'Profile Personalization'),
                  text: t('landing.data2Text', 'Your basic profile information (Name, Email, Profile Picture) is used to construct your MIGO traveler profile so other users know who they are matching with.')
                },
                {
                  label: t('landing.data3Label', 'Match Accuracy'),
                  text: t('landing.data3Text', 'We request location data to match you with travelers heading to the same destinations or currently nearby.')
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-sm mb-1">{item.label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-8 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-80">
            <img src={siteLogo} alt="MIGO Logo" className="h-6 object-contain grayscale" />
            <span className="font-bold text-sm text-muted-foreground truncate">© {new Date().getFullYear()} MIGO. {t('landing.allRights', 'All rights reserved.')}</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t('login.privacy', 'Privacy Policy')}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t('login.terms', 'Terms of Service')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
