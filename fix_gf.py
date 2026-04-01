import re
import os

with open("src/i18n/filterLocales.ts", "r", encoding="utf-8") as f:
    content = f.read()

# I will add 'gf' block inside ko, en, ja, zh, es, id, vi, th.

gf_translations = {
    "ko": """
    gf: {
      c_tokyo: "도쿄", c_seoul: "서울", c_bangkok: "방콕", c_bali: "발리", c_danang: "다낭", c_sg: "싱가포르", c_osaka: "오사카", c_taipei: "타이베이", c_chiangmai: "치앙마이", c_cebu: "세부", c_bcn: "바르셀로나", c_paris: "파리",
      n_jp: "일본", n_kr: "한국", n_th: "태국", n_id: "인도네시아", n_vn: "베트남", n_sg: "싱가포르", n_tw: "대만", n_ph: "필리핀", n_es: "스페인", n_fr: "프랑스",
      s_2: "2명", s_3: "3명", s_4: "4명", s_5: "5명", s_6: "6명",
      w_sun: "일", w_mon: "월", w_tue: "화", w_wed: "수", w_thu: "목", w_fri: "금", w_sat: "토",
      m_1: "1월", m_2: "2월", m_3: "3월", m_4: "4월", m_5: "5월", m_6: "6월", m_7: "7월", m_8: "8월", m_9: "9월", m_10: "10월", m_11: "11월", m_12: "12월",
      p_we: "이번주말", p_nw: "다음주", p_tm: "이번달", p_nm: "다음달",
      title: "여행 필터", desc: "원하는 여행 동행의 조건을 설정하세요.", reset: "초기화",
      dest: "여행지", dest_ph: "도쿄, 파리, 뉴욕 등 도시 검색", search_res: "검색 결과", pop_city: "인기 도시", apply_as_is: " (으)로 검색",
      date: "날짜", sel_start: "출발일을 선택하세요", sel_end: "도착일을 선택하세요", year: "년 ", month: "월 ", day: "일",
      size: "인원수", all: "인원 무관", s_6_more: "6명 이상", unit_p: "명",
      apply: "필터 적용 ", unit_f: "개", view_all: "전체 그룹 보기"
    }
""",
    "en": """
    gf: {
      c_tokyo: "Tokyo", c_seoul: "Seoul", c_bangkok: "Bangkok", c_bali: "Bali", c_danang: "Da Nang", c_sg: "Singapore", c_osaka: "Osaka", c_taipei: "Taipei", c_chiangmai: "Chiang Mai", c_cebu: "Cebu", c_bcn: "Barcelona", c_paris: "Paris",
      n_jp: "Japan", n_kr: "Korea", n_th: "Thailand", n_id: "Indonesia", n_vn: "Vietnam", n_sg: "Singapore", n_tw: "Taiwan", n_ph: "Philippines", n_es: "Spain", n_fr: "France",
      s_2: "2 People", s_3: "3 People", s_4: "4 People", s_5: "5 People", s_6: "6 People",
      w_sun: "Sun", w_mon: "Mon", w_tue: "Tue", w_wed: "Wed", w_thu: "Thu", w_fri: "Fri", w_sat: "Sat",
      m_1: "Jan", m_2: "Feb", m_3: "Mar", m_4: "Apr", m_5: "May", m_6: "Jun", m_7: "Jul", m_8: "Aug", m_9: "Sep", m_10: "Oct", m_11: "Nov", m_12: "Dec",
      p_we: "This wknd", p_nw: "Next week", p_tm: "This month", p_nm: "Next month",
      title: "Travel Filter", desc: "Set conditions for your companion.", reset: "Reset",
      dest: "Destination", dest_ph: "Search Paris, Tokyo...", search_res: "Search Results", pop_city: "Popular Cities", apply_as_is: " as destination",
      date: "Dates", sel_start: "Select Start Date", sel_end: "Select End Date", year: ", ", month: "", day: "",
      size: "Group Size", all: "Any", s_6_more: "6+ People", unit_p: "",
      apply: "Apply Filter ", unit_f: "", view_all: "View All Groups"
    }
""",
    "ja": """
    gf: {
      c_tokyo: "東京", c_seoul: "ソウル", c_bangkok: "バンコク", c_bali: "バリ島", c_danang: "ダナン", c_sg: "シンガポール", c_osaka: "大阪", c_taipei: "台北", c_chiangmai: "チェンマイ", c_cebu: "セブ", c_bcn: "バルセロナ", c_paris: "パリ",
      n_jp: "日本", n_kr: "韓国", n_th: "タイ", n_id: "インドネシア", n_vn: "ベトナム", n_sg: "シンガポール", n_tw: "台湾", n_ph: "フィリピン", n_es: "スペイン", n_fr: "フランス",
      s_2: "2名", s_3: "3名", s_4: "4名", s_5: "5名", s_6: "6名",
      w_sun: "日", w_mon: "月", w_tue: "火", w_wed: "水", w_thu: "木", w_fri: "金", w_sat: "土",
      m_1: "1月", m_2: "2月", m_3: "3月", m_4: "4月", m_5: "5月", m_6: "6月", m_7: "7月", m_8: "8月", m_9: "9月", m_10: "10月", m_11: "11月", m_12: "12月",
      p_we: "今週末", p_nw: "来週", p_tm: "今月", p_nm: "来月",
      title: "旅行フィルター", desc: "希望の同行者の条件を設定してください。", reset: "リセット",
      dest: "目的地", dest_ph: "東京、ソウルなどを検索", search_res: "検索結果", pop_city: "人気都市", apply_as_is: " で検索",
      date: "日程", sel_start: "出発日を選択", sel_end: "到着日を選択", year: "年 ", month: "月 ", day: "日",
      size: "人数", all: "指定なし", s_6_more: "6名以上", unit_p: "名",
      apply: "フィルター適用 ", unit_f: "個", view_all: "全グループを表示"
    }
""",
    "zh": """
    gf: {
      c_tokyo: "东京", c_seoul: "首尔", c_bangkok: "曼谷", c_bali: "巴厘岛", c_danang: "岘港", c_sg: "新加坡", c_osaka: "大阪", c_taipei: "台北", c_chiangmai: "清迈", c_cebu: "宿务", c_bcn: "巴塞罗那", c_paris: "巴黎",
      n_jp: "日本", n_kr: "韩国", n_th: "泰国", n_id: "印尼", n_vn: "越南", n_sg: "新加坡", n_tw: "台湾", n_ph: "菲律宾", n_es: "西班牙", n_fr: "法国",
      s_2: "2人", s_3: "3人", s_4: "4人", s_5: "5人", s_6: "6人",
      w_sun: "日", w_mon: "一", w_tue: "二", w_wed: "三", w_thu: "四", w_fri: "五", w_sat: "六",
      m_1: "1月", m_2: "2月", m_3: "3月", m_4: "4月", m_5: "5月", m_6: "6月", m_7: "7月", m_8: "8月", m_9: "9月", m_10: "10月", m_11: "11月", m_12: "12月",
      p_we: "本周末", p_nw: "下周", p_tm: "本月", p_nm: "下个月",
      title: "旅行筛选", desc: "设置您想要的同伴条件。", reset: "重置",
      dest: "目的地", dest_ph: "搜索东京、巴黎...", search_res: "搜索结果", pop_city: "热门城市", apply_as_is: " 作为目的地",
      date: "日期", sel_start: "选择出发日", sel_end: "选择到达日", year: "年 ", month: "月 ", day: "日",
      size: "人数", all: "不限", s_6_more: "6人以上", unit_p: "人",
      apply: "应用筛选 ", unit_f: "个", view_all: "显示所有群组"
    }
""",
    "es": """
    gf: {
      c_tokyo: "Tokio", c_seoul: "Seúl", c_bangkok: "Bangkok", c_bali: "Bali", c_danang: "Da Nang", c_sg: "Singapur", c_osaka: "Osaka", c_taipei: "Taipéi", c_chiangmai: "Chiang Mai", c_cebu: "Cebú", c_bcn: "Barcelona", c_paris: "París",
      n_jp: "Japón", n_kr: "Corea", n_th: "Tailandia", n_id: "Indonesia", n_vn: "Vietnam", n_sg: "Singapur", n_tw: "Taiwán", n_ph: "Filipinas", n_es: "España", n_fr: "Francia",
      s_2: "2 Personas", s_3: "3 Personas", s_4: "4 Personas", s_5: "5 Personas", s_6: "6 Personas",
      w_sun: "Dom", w_mon: "Lun", w_tue: "Mar", w_wed: "Mié", w_thu: "Jue", w_fri: "Vie", w_sat: "Sáb",
      m_1: "Ene", m_2: "Feb", m_3: "Mar", m_4: "Abr", m_5: "May", m_6: "Jun", m_7: "Jul", m_8: "Ago", m_9: "Sep", m_10: "Oct", m_11: "Nov", m_12: "Dic",
      p_we: "Este finde", p_nw: "Próxima sem", p_tm: "Este mes", p_nm: "Próx. mes",
      title: "Filtro de Viaje", desc: "Condiciones de tu compañero.", reset: "Reset",
      dest: "Destino", dest_ph: "Busca París, Tokio...", search_res: "Resultados", pop_city: "Ciudades Populares", apply_as_is: " como destino",
      date: "Fechas", sel_start: "Inicio", sel_end: "Fin", year: ", ", month: "", day: "",
      size: "Tamaño", all: "Todos", s_6_more: "6+ Personas", unit_p: "",
      apply: "Aplicar ", unit_f: "", view_all: "Ver Todo"
    }
""",
    "id": """
    gf: {
      c_tokyo: "Tokyo", c_seoul: "Seoul", c_bangkok: "Bangkok", c_bali: "Bali", c_danang: "Da Nang", c_sg: "Singapura", c_osaka: "Osaka", c_taipei: "Taipei", c_chiangmai: "Chiang Mai", c_cebu: "Cebu", c_bcn: "Barcelona", c_paris: "Paris",
      n_jp: "Jepang", n_kr: "Korea", n_th: "Thailand", n_id: "Indonesia", n_vn: "Vietnam", n_sg: "Singapura", n_tw: "Taiwan", n_ph: "Filipina", n_es: "Spanyol", n_fr: "Prancis",
      s_2: "2 Orang", s_3: "3 Orang", s_4: "4 Orang", s_5: "5 Orang", s_6: "6 Orang",
      w_sun: "Min", w_mon: "Sen", w_tue: "Sel", w_wed: "Rab", w_thu: "Kam", w_fri: "Jum", w_sat: "Sab",
      m_1: "Jan", m_2: "Feb", m_3: "Mar", m_4: "Apr", m_5: "Mei", m_6: "Jun", m_7: "Jul", m_8: "Agu", m_9: "Sep", m_10: "Okt", m_11: "Nov", m_12: "Des",
      p_we: "Akhir pekan ini", p_nw: "Minggu depan", p_tm: "Bulan ini", p_nm: "Bulan Depan",
      title: "Filter Perjalanan", desc: "Atur kondisi teman jalan Anda.", reset: "Reset",
      dest: "Tujuan", dest_ph: "Cari Tokyo, Paris...", search_res: "Hasil Pencarian", pop_city: "Kota Populer", apply_as_is: " ",
      date: "Tanggal", sel_start: "Tgl Mulai", sel_end: "Tgl Berakhir", year: ", ", month: "", day: "",
      size: "Anggota", all: "Semua", s_6_more: "6+ Orang", unit_p: "",
      apply: "Terapkan ", unit_f: "", view_all: "Semua Grup"
    }
""",
    "vi": """
    gf: {
      c_tokyo: "Tokyo", c_seoul: "Seoul", c_bangkok: "Bangkok", c_bali: "Bali", c_danang: "Đà Nẵng", c_sg: "Singapore", c_osaka: "Osaka", c_taipei: "Đài Bắc", c_chiangmai: "Chiang Mai", c_cebu: "Cebu", c_bcn: "Barcelona", c_paris: "Paris",
      n_jp: "Nhật Bản", n_kr: "Hàn Quốc", n_th: "Thái Lan", n_id: "Indonesia", n_vn: "Việt Nam", n_sg: "Singapore", n_tw: "Đài Loan", n_ph: "Philippines", n_es: "Tây Ban Nha", n_fr: "Pháp",
      s_2: "2 Người", s_3: "3 Người", s_4: "4 Người", s_5: "5 Người", s_6: "6 Người",
      w_sun: "CN", w_mon: "T2", w_tue: "T3", w_wed: "T4", w_thu: "T5", w_fri: "T6", w_sat: "T7",
      m_1: "T1", m_2: "T2", m_3: "T3", m_4: "T4", m_5: "T5", m_6: "T6", m_7: "T7", m_8: "T8", m_9: "T9", m_10: "T10", m_11: "T11", m_12: "T12",
      p_we: "Cuối tuần", p_nw: "Tuần tới", p_tm: "Tháng này", p_nm: "Tháng tới",
      title: "Bộ Lọc", desc: "Tìm bạn đồng hành.", reset: "Reset",
      dest: "Điểm đến", dest_ph: "Tìm Tokyo, Paris...", search_res: "S. Kết quả", pop_city: "Thành phố HOT", apply_as_is: " ",
      date: "Ngày", sel_start: "Ngày bắt đầu", sel_end: "Ngày kết thúc", year: ", ", month: "", day: "",
      size: "Số người", all: "Tất cả", s_6_more: ">6 Người", unit_p: "",
      apply: "Áp dụng ", unit_f: "", view_all: "Xem tất cả"
    }
""",
    "th": """
    gf: {
      c_tokyo: "โตเกียว", c_seoul: "โซล", c_bangkok: "กรุงเทพฯ", c_bali: "บาหลี", c_danang: "ดานัง", c_sg: "สิงคโปร์", c_osaka: "โอซาก้า", c_taipei: "ไทเป", c_chiangmai: "เชียงใหม่", c_cebu: "เซบู", c_bcn: "บาร์เซโลนา", c_paris: "ปารีส",
      n_jp: "ญี่ปุ่น", n_kr: "เกาหลี", n_th: "ไทย", n_id: "อินโดนีเซีย", n_vn: "เวียดนาม", n_sg: "สิงคโปร์", n_tw: "ไต้หวัน", n_ph: "ฟิลิปปินส์", n_es: "สเปน", n_fr: "ฝรั่งเศส",
      s_2: "2 คน", s_3: "3 คน", s_4: "4 คน", s_5: "5 คน", s_6: "6 คน",
      w_sun: "อา", w_mon: "จ", w_tue: "อ", w_wed: "พ", w_thu: "พฤ", w_fri: "ศ", w_sat: "ส",
      m_1: "ม.ค.", m_2: "ก.พ.", m_3: "มี.ค.", m_4: "เม.ย.", m_5: "พ.ค.", m_6: "มิ.ย.", m_7: "ก.ค.", m_8: "ส.ค.", m_9: "ก.ย.", m_10: "ต.ค.", m_11: "พ.ย.", m_12: "ธ.ค.",
      p_we: "สุดสัปดาห์", p_nw: "สัปดาห์หน้า", p_tm: "เดือนนี้", p_nm: "เดือนหน้า",
      title: "ตัวกรอง", desc: "ค้นหาผู้ร่วมทาง", reset: "รีเซ็ต",
      dest: "จุดหมาย", dest_ph: "ค้นหา...", search_res: "ผลลัพธ์", pop_city: "ยอดนิยม", apply_as_is: " ",
      date: "วันที่", sel_start: "วันไป", sel_end: "วันกลับ", year: ", ", month: "", day: "",
      size: "จำนวน", all: "ทั้งหมด", s_6_more: "6+ คน", unit_p: "",
      apply: "ใช้ตัวกรอง ", unit_f: "", view_all: "ทั้งหมด"
    }
"""
}

# The block starts as:
#   ko: {
#     gdf: { ... },

for lang, gf_block in gf_translations.items():
    search_str = f"  {lang}: {{\n    gdf: {{"
    if search_str in content:
        replace_str = f"  {lang}: {{\n{gf_block}    gdf: {{"
        content = content.replace(search_str, replace_str)

with open("src/i18n/filterLocales.ts", "w", encoding="utf-8") as f:
    f.write(content)

