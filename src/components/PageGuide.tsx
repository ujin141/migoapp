import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, ChevronRight } from "lucide-react";

// ─── Per-page guide definitions ─────────────────────────────────────────────
export type PageId = "match" | "discover" | "map" | "chat" | "profile";

interface GuideItem {
  icon: string;         // emoji or unicode icon representation
  label: string;        // short label shown below icon
  desc: string;         // tooltip / description
}

interface PageGuideData {
  title: string;
  subtitle: string;
  items: GuideItem[];
}

function buildGuides(): Record<PageId, PageGuideData> {
  const t = i18n.t.bind(i18n);
  return {
    match: {
      title: t("guide.match.title", "💜 How to Use Matching"),
      subtitle: t("guide.match.subtitle", "Swipe cards to find travelers you like!"),
      items: [
        {
          icon: "👈",
          label: t("guide.match.pass.label", "Pass"),
          desc: t("guide.match.pass.desc", "Swipe left or tap the X button to pass."),
        },
        {
          icon: "❤️",
          label: t("guide.match.like.label", "Like"),
          desc: t("guide.match.like.desc", "Swipe right or tap the heart to like. When both like each other — it's a match!"),
        },
        {
          icon: "⭐",
          label: t("guide.match.superlike.label", "Super Like"),
          desc: t("guide.match.superlike.desc", "Tap the star button to Super Like with a special message. You'll stand out more!"),
        },
        {
          icon: "⚡",
          label: t("guide.match.boost.label", "Boost"),
          desc: t("guide.match.boost.desc", "Boost puts your profile at the top for 30 minutes."),
        },
        {
          icon: "📍",
          label: t("guide.match.checkin.label", "GPS Check-in"),
          desc: t("guide.match.checkin.desc", "Check in to your current city to see same-city travelers first."),
        },
        {
          icon: "🎯",
          label: t("guide.match.mission.label", "Today's Goal"),
          desc: t("guide.match.mission.desc", "Set today's travel goal (food, sightseeing, party, etc.) to connect with like-minded travelers."),
        },
        {
          icon: "🔔",
          label: t("guide.match.notif.label", "Notifications"),
          desc: t("guide.match.notif.desc", "Tap the bell icon to check likes, matches, and messages."),
        },
        {
          icon: "🎛️",
          label: t("guide.match.filter.label", "Filter"),
          desc: t("guide.match.filter.desc", "Filter by age, gender, distance, MBTI, and travel style."),
        },
      ],
    },
    discover: {
      title: t("guide.discover.title", "🧭 How to Use Discover"),
      subtitle: t("guide.discover.subtitle", "Browse travel groups, community feed, and live meetups!"),
      items: [
        {
          icon: "👥",
          label: t("guide.discover.groups.label", "Travel Groups"),
          desc: t("guide.discover.groups.desc", "Find and apply to travel groups matching your destination, dates, and style."),
        },
        {
          icon: "📸",
          label: t("guide.discover.feed.label", "Feed"),
          desc: t("guide.discover.feed.desc", "Scroll through real-time travel photos and stories from other travelers."),
        },
        {
          icon: "⚡",
          label: t("guide.discover.lightning.label", "Flash Meetup"),
          desc: t("guide.discover.lightning.desc", "Join spontaneous meetups happening nearby right now."),
        },
        {
          icon: "➕",
          label: t("guide.discover.create.label", "Create Group"),
          desc: t("guide.discover.create.desc", "Tap + at the bottom right to create your own travel group."),
        },
        {
          icon: "❤️",
          label: t("guide.discover.like.label", "Feed Like"),
          desc: t("guide.discover.like.desc", "Tap the heart on posts to send a like."),
        },
        {
          icon: "💬",
          label: t("guide.discover.comment.label", "Comment"),
          desc: t("guide.discover.comment.desc", "Leave a comment to connect with other travelers."),
        },
      ],
    },
    map: {
      title: t("guide.map.title", "📍 How to Use Map"),
      subtitle: t("guide.map.subtitle", "Find nearby travelers, hotplaces, and meetups on the live map!"),
      items: [
        {
          icon: "🧑‍🤝‍🧑",
          label: t("guide.map.travelers.label", "Nearby Travelers"),
          desc: t("guide.map.travelers.desc", "Switch to the Travelers tab to see nearby travelers on the map."),
        },
        {
          icon: "🔥",
          label: t("guide.map.hotplace.label", "Hotplaces"),
          desc: t("guide.map.hotplace.desc", "Browse clubs, landmarks, and restaurants by category in the Hotplace tab."),
        },
        {
          icon: "🍻",
          label: t("guide.map.groups.label", "Nearby Groups"),
          desc: t("guide.map.groups.desc", "Check active flash meetups near you in the Groups tab."),
        },
        {
          icon: "📷",
          label: t("guide.map.community.label", "Local Feed"),
          desc: t("guide.map.community.desc", "See photos posted by nearby travelers in real time in the Photos tab."),
        },
        {
          icon: "🍽️",
          label: t("guide.map.restaurants.label", "Nearby Restaurants"),
          desc: t("guide.map.restaurants.desc", "Find nearby restaurants based on your current location in the Food tab."),
        },
        {
          icon: "📡",
          label: t("guide.map.realtime.label", "Live Alerts"),
          desc: t("guide.map.realtime.desc", "Get pop-up alerts when a new traveler or meetup appears nearby."),
        },
      ],
    },
    chat: {
      title: t("guide.chat.title", "💬 How to Use Chat"),
      subtitle: t("guide.chat.subtitle", "Chat with matched travelers and plan meetups!"),
      items: [
        {
          icon: "💬",
          label: t("guide.chat.threads.label", "Chat List"),
          desc: t("guide.chat.threads.desc", "Your matched travelers' conversations appear here. Tap to open a chat."),
        },
        {
          icon: "📅",
          label: t("guide.chat.schedule.label", "Share Schedule"),
          desc: t("guide.chat.schedule.desc", "Tap + in the chat to share a schedule card with date and location."),
        },
        {
          icon: "🤝",
          label: t("guide.chat.meet.label", "Propose Meetup"),
          desc: t("guide.chat.meet.desc", "Use the meetup button to formally propose a meeting date and place."),
        },
        {
          icon: "🔒",
          label: t("guide.chat.safe.label", "Safe Meeting"),
          desc: t("guide.chat.safe.desc", "Use the pre-meeting checklist and safety system to meet with confidence."),
        },
        {
          icon: "⭐",
          label: t("guide.chat.review.label", "Post-Meet Review"),
          desc: t("guide.chat.review.desc", "Leave a review after meeting — it boosts your trust score."),
        },
      ],
    },
    profile: {
      title: t("guide.profile.title", "✨ How to Use Profile"),
      subtitle: t("guide.profile.subtitle", "Complete your profile and manage settings!"),
      items: [
        {
          icon: "📝",
          label: t("guide.profile.edit.label", "Edit Profile"),
          desc: t("guide.profile.edit.desc", "Tap your profile card to edit photos, name, bio, and travel style."),
        },
        {
          icon: "🛡️",
          label: t("guide.profile.safety.label", "Safety System"),
          desc: t("guide.profile.safety.desc", "Use the Safety button to check the pre-meeting checklist and prepare safely."),
        },
        {
          icon: "🗓️",
          label: t("guide.profile.trips.label", "My Trips"),
          desc: t("guide.profile.trips.desc", "Register travel plans to auto-connect with people at the same destination and time."),
        },
        {
          icon: "👥",
          label: t("guide.profile.matches.label", "Matches"),
          desc: t("guide.profile.matches.desc", "See all your matched travelers at a glance."),
        },
        {
          icon: "🌏",
          label: t("guide.profile.language.label", "Language"),
          desc: t("guide.profile.language.desc", "Go to Settings > Language to switch the app language among 49 options."),
        },
        {
          icon: "💎",
          label: t("guide.profile.plus.label", "Migo Plus"),
          desc: t("guide.profile.plus.desc", "Upgrade to Migo Plus for unlimited likes, super likes, advanced filters, and more."),
        },
        {
          icon: "🔔",
          label: t("guide.profile.notif.label", "Notifications"),
          desc: t("guide.profile.notif.desc", "Toggle match, chat, and group notifications individually."),
        },
      ],
    },
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
interface PageGuideProps {
  page: PageId;
  /** If true, shows as a small floating ? button. Otherwise renders inline trigger. */
  floating?: boolean;
}

export default function PageGuide({ page, floating = true }: PageGuideProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const guides = buildGuides();
  const guide = guides[page];
  const [activeItem, setActiveItem] = useState<number | null>(null);

  // Auto-show guide on first visit to this page (only after the main tutorial is done)
  useEffect(() => {
    const TUTORIAL_KEY = "migo_tutorial_done";
    const GUIDE_KEY = `migo_guide_${page}_done`;

    const tutorialDone = !!localStorage.getItem(TUTORIAL_KEY);
    const guideDone = !!localStorage.getItem(GUIDE_KEY);

    if (tutorialDone && !guideDone) {
      // Small delay so the page animation settles first
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(GUIDE_KEY, "1");
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [page]);

  return (
    <>
      {/* ── Trigger button ── */}
      {floating ? (
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm"
          aria-label={t("guide.openButton", "Help")}
        >
          <HelpCircle size={15} className="text-primary" />
        </motion.button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle size={12} />
          <span className="truncate">{t("guide.openButton", "Help")}</span>
        </button>
      )}

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {open && createPortal(
          <motion.div
            className="fixed inset-0 z-[300] flex flex-col items-center justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setOpen(false); setActiveItem(null); }}
            />

            {/* Sheet — positioned above bottom nav bar (~68px) */}
            <motion.div
              className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden max-h-[calc(85vh-68px)] flex flex-col mb-[68px]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              {/* Gradient bar */}
              <div className="h-1 w-full shrink-0" style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899, #f97316)" }} />

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-lg font-extrabold text-foreground leading-tight truncate">{guide.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{guide.subtitle}</p>
                </div>
                <button
                  onClick={() => { setOpen(false); setActiveItem(null); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
                >
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>

              {/* Items list — extra bottom padding so last item clears the sheet corners */}
              <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-2">
                {guide.items.map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setActiveItem(activeItem === i ? null : i)}
                    className="w-full text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${activeItem === i ? "bg-primary/8 border-primary/30" : "bg-muted/50 border-transparent"}`}>
                      {/* Icon bubble */}
                      <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-xl shrink-0 shadow-sm">
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${activeItem === i ? "text-primary" : "text-foreground"}`}>
                          {item.label}
                        </p>
                        <AnimatePresence>
                          {activeItem === i && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-xs text-muted-foreground leading-relaxed mt-1 break-words overflow-hidden"
                            >
                              {item.desc}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <motion.div
                        animate={{ rotate: activeItem === i ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0"
                      >
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>, document.body
        )}
      </AnimatePresence>
    </>
  );
}
