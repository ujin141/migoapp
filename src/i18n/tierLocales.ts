export const TIER_LOCALES: Record<string, any> = {
  ko: {
    tier: {
      travel: { label: "여행", sublabel: "기본 참여", tagline: '"한 번 해볼까?" 하는 가격' },
      party: { label: "파티 / 클럽", sublabel: "놀러 가는 비용", tagline: "진짜 놀 사람만 들어와요" },
      premium: { label: "프리미엄", sublabel: "외국인 / 인기 그룹", tagline: "가치 있는 자리" }
    }
  },
  en: {
    tier: {
      travel: { label: "Travel", sublabel: "Basic Entry", tagline: "An easy price to start" },
      party: { label: "Party / Club", sublabel: "Going Out Cost", tagline: "For real party lovers" },
      premium: { label: "Premium", sublabel: "Hot Groups / Global", tagline: "Worth the experience" }
    }
  },
  ja: {
    tier: {
      travel: { label: "旅行", sublabel: "基本参加", tagline: "気軽に始められる価格" },
      party: { label: "パーティー/クラブ", sublabel: "遊び代", tagline: "本気で楽しむ人限定" },
      premium: { label: "プレミアム", sublabel: "人気グループ/グローバル", tagline: "価値ある体験" }
    }
  },
  zh: {
    tier: {
      travel: { label: "旅行", sublabel: "基本参与", tagline: "轻松开始的价格" },
      party: { label: "派对 / 俱乐部", sublabel: "娱乐消费", tagline: "专为热爱派对的人" },
      premium: { label: "高级", sublabel: "热门群组 / 国际", tagline: "物有所值的体验" }
    }
  },
  es: {
    tier: {
      travel: { label: "Viaje", sublabel: "Entrada Básica", tagline: "Un precio fácil" },
      party: { label: "Fiesta / Club", sublabel: "Costo de Salida", tagline: "Solo para fiesteros" },
      premium: { label: "Premium", sublabel: "Grupos Top / Global", tagline: "Vale la pena" }
    }
  },
  fr: {
    tier: {
      travel: { label: "Voyage", sublabel: "Entrée Basique", tagline: "Un prix facile à démarrer" },
      party: { label: "Fête / Club", sublabel: "Coût de Sortie", tagline: "Pour les fêtards" },
      premium: { label: "Premium", sublabel: "Groupes Top / Global", tagline: "Vaut l'expérience" }
    }
  },
  de: {
    tier: {
      travel: { label: "Reisen", sublabel: "Basiseintritt", tagline: "Ein leichter Preis" },
      party: { label: "Party / Club", sublabel: "Ausgehkosten", tagline: "Für echte Partygänger" },
      premium: { label: "Premium", sublabel: "Topgruppen / Global", tagline: "Die Erfahrung wert" }
    }
  },
  pt: {
    tier: {
      travel: { label: "Viagem", sublabel: "Entrada Básica", tagline: "Um preço fácil" },
      party: { label: "Festa / Clube", sublabel: "Custo de Saída", tagline: "Só festeiro" },
      premium: { label: "Premium", sublabel: "Grupos Top / Global", tagline: "Vale a pena" }
    }
  },
  id: {
    tier: {
      travel: { label: "Perjalanan", sublabel: "Masuk Dasar", tagline: "Harga yg terjangkau" },
      party: { label: "Pesta / Klub", sublabel: "Biaya Hangout", tagline: "Hanya anak pesta" },
      premium: { label: "Premium", sublabel: "Grup Teratas", tagline: "Pengalaman berharga" }
    }
  },
  vi: {
    tier: {
      travel: { label: "Du lịch", sublabel: "Vé cơ bản", tagline: "Mức giá dễ bắt đầu" },
      party: { label: "Tiệc / Club", sublabel: "Chi phí đi chơi", tagline: "Dành cho người thích tiệc" },
      premium: { label: "Cao cấp", sublabel: "Nhóm Hot", tagline: "Đáng giá trải nghiệm" }
    }
  },
  th: {
    tier: {
      travel: { label: "ท่องเที่ยว", sublabel: "เข้าร่วมพื้นฐาน", tagline: "ราคาเริ่มต้นง่ายๆ" },
      party: { label: "ปาร์ตี้ / คลับ", sublabel: "ค่าใช้จ่ายเที่ยว", tagline: "สำหรับสายปาร์ตี้ตัวจริง" },
      premium: { label: "พรีเมียม", sublabel: "กลุ่มยอดนิยม", tagline: "คุ้มค่ากับประสบการณ์" }
    }
  }
};

const SUPPORTED_LANGS = [
  "ar", "hi", "ru", "tr", "it", "nl", "pl", "sv", "da", "no", "fi",
  "cs", "ro", "hu", "el", "bg", "uk", "he", "bn", "ta", "te", "kn",
  "ml", "gu", "mr", "pa", "fa", "ur", "sw", "zu", "ca", "hr", "sk",
  "sl", "lv", "lt", "et", "is"
];

for (const lang of SUPPORTED_LANGS) {
  if (!TIER_LOCALES[lang]) {
    TIER_LOCALES[lang] = TIER_LOCALES.en;
  }
}
