import re

with open("src/components/GlobalFilter.tsx", "r", encoding="utf-8") as f:
    text = f.read()

replacements = {
    r't\("auto.db_city_도쿄", \{ defaultValue: "도쿄" \}\)': 't("gf.c_tokyo")',
    r't\("auto.db_country_일본"\)': 't("gf.n_jp")',
    
    r't\("auto.db_city_서울", \{ defaultValue: "서울" \}\)': 't("gf.c_seoul")',
    r't\("auto.db_country_한국"\)': 't("gf.n_kr")',

    r't\("auto.db_city_방콕", \{ defaultValue: "방콕" \}\)': 't("gf.c_bangkok")',
    r't\("auto.db_country_태국"\)': 't("gf.n_th")',

    r't\("auto.db_city_발리", \{ defaultValue: "발리" \}\)': 't("gf.c_bali")',
    r't\("auto.db_country_인도네시아"\)': 't("gf.n_id")',

    r't\("auto.db_city_다낭", \{ defaultValue: "다낭" \}\)': 't("gf.c_danang")',
    r't\("auto.db_country_베트남"\)': 't("gf.n_vn")',

    r't\("auto.db_city_싱가포르", \{ defaultValue: "싱가포르" \}\)': 't("gf.c_sg")',
    r't\("auto.db_country_싱가포르"\)': 't("gf.n_sg")',

    r't\("auto.db_city_오사카", \{ defaultValue: "오사카" \}\)': 't("gf.c_osaka")',
    
    r't\("auto.db_city_타이베이", \{ defaultValue: "타이베이" \}\)': 't("gf.c_taipei")',
    r't\("auto.db_country_대만"\)': 't("gf.n_tw")',

    r't\("auto.db_city_치앙마이", \{ defaultValue: "치앙마이" \}\)': 't("gf.c_chiangmai")',
    
    r't\("auto.db_city_세부", \{ defaultValue: "세부" \}\)': 't("gf.c_cebu")',
    r't\("auto.db_country_필리핀"\)': 't("gf.n_ph")',

    r't\("auto.db_city_바르셀로나", \{ defaultValue: "바르셀로나" \}\)': 't("gf.c_bcn")',
    r't\("auto.db_country_스페인"\)': 't("gf.n_es")',

    r't\("auto.db_city_파리", \{ defaultValue: "파리" \}\)': 't("gf.c_paris")',
    r't\("auto.db_country_프랑스"\)': 't("gf.n_fr")',

    r't\("auto.z_2명_652fc6"\)': 't("gf.s_2")',
    r't\("auto.z_3명_38c9b2"\)': 't("gf.s_3")',
    r't\("auto.z_4명_8b11ed"\)': 't("gf.s_4")',
    r't\("auto.z_5명_234305"\)': 't("gf.s_5")',
    r't\("auto.z_6명_0f6d08"\)': 't("gf.s_6")',

    r't\("auto.db_week_일", \{ defaultValue: "일" \}\)': 't("gf.w_sun")',
    r't\("auto.db_week_월", \{ defaultValue: "월" \}\)': 't("gf.w_mon")',
    r't\("auto.db_week_화", \{ defaultValue: "화" \}\)': 't("gf.w_tue")',
    r't\("auto.db_week_수", \{ defaultValue: "수" \}\)': 't("gf.w_wed")',
    r't\("auto.db_week_목", \{ defaultValue: "목" \}\)': 't("gf.w_thu")',
    r't\("auto.db_week_금", \{ defaultValue: "금" \}\)': 't("gf.w_fri")',
    r't\("auto.db_week_토", \{ defaultValue: "토" \}\)': 't("gf.w_sat")',

    r't\("auto.db_month_1월", \{ defaultValue: "1월" \}\)': 't("gf.m_1")',
    r't\("auto.db_month_2월", \{ defaultValue: "2월" \}\)': 't("gf.m_2")',
    r't\("auto.db_month_3월", \{ defaultValue: "3월" \}\)': 't("gf.m_3")',
    r't\("auto.db_month_4월", \{ defaultValue: "4월" \}\)': 't("gf.m_4")',
    r't\("auto.db_month_5월", \{ defaultValue: "5월" \}\)': 't("gf.m_5")',
    r't\("auto.db_month_6월", \{ defaultValue: "6월" \}\)': 't("gf.m_6")',
    r't\("auto.db_month_7월", \{ defaultValue: "7월" \}\)': 't("gf.m_7")',
    r't\("auto.db_month_8월", \{ defaultValue: "8월" \}\)': 't("gf.m_8")',
    r't\("auto.db_month_9월", \{ defaultValue: "9월" \}\)': 't("gf.m_9")',
    r't\("auto.db_month_10월", \{ defaultValue: "10월" \}\)': 't("gf.m_10")',
    r't\("auto.db_month_11월", \{ defaultValue: "11월" \}\)': 't("gf.m_11")',
    r't\("auto.db_month_12월", \{ defaultValue: "12월" \}\)': 't("gf.m_12")',

    r't\("auto.z_이번주말_4eb8f2"\)': 't("gf.p_we")',
    r't\("auto.z_다음주_415e52"\)': 't("gf.p_nw")',
    r't\("auto.z_이번달_35cb7d"\)': 't("gf.p_tm")',
    r't\("auto.z_다음달_56cafa"\)': 't("gf.p_nm")',

    r't\("auto.z_여행필터_ef40d3"\)': 't("gf.title")',
    r't\("auto.z_원하는여_063fc3"\)': 't("gf.desc")',
    r't\("auto.z_초기화_2d7cf9"\)': 't("gf.reset")',
    r't\("auto.z_여행지_3d9769"\)': 't("gf.dest")',
    r't\("auto.z_도쿄파리_8a3f30"\)': 't("gf.dest_ph")',
    r't\("auto.db_ui_search_res", \{ defaultValue: "검색 결과" \}\)': 't("gf.search_res")',
    r't\("auto.db_ui_pop_city", \{ defaultValue: "인기 도시" \}\)': 't("gf.pop_city")',
    r't\("auto.z_그대로적_fedcdd"\)': 't("gf.apply_as_is")',
    r't\("auto.z_날짜_a93b53"\)': 't("gf.date")',
    r't\("auto.db_ui_start_date", \{ defaultValue: "출발일을 선택하세요" \}\)': 't("gf.sel_start")',
    r't\("auto.db_ui_end_date", \{ defaultValue: "도착일을 선택하세요" \}\)': 't("gf.sel_end")',
    r't\("auto.z_년_e29d2c"\)': 't("gf.year")',
    r't\("auto.z_인원수_553bc2"\)': 't("gf.size")',
    r't\("auto.z_전체_d1d0de"\)': 't("gf.all")',
    r't\("auto.db_ui_6_more", \{ defaultValue: "6명 이상" \}\)': 't("gf.s_6_more")',
    r't\("auto.z_명_db7391", \{ defaultValue: "명" \}\)': 't("gf.unit_p")',
    r't\("auto.z_필터적용_a0bd26"\)': 't("gf.apply")',
    r't\("auto.z_개_d22b87"\)': 't("gf.unit_f")',
    r't\("auto.db_ui_view_all", \{ defaultValue: "전체 보기" \}\)': 't("gf.view_all")',
    r't\("auto.z_월_7c9d2f", \{ defaultValue: "월" \}\)': 't("gf.month")',
    r't\("auto.z_일_5d2b7d", \{ defaultValue: "일" \}\)': 't("gf.day")',
}

for k, v in replacements.items():
    text = re.sub(k, v, text)

with open("src/components/GlobalFilter.tsx", "w", encoding="utf-8") as f:
    f.write(text)
