"""
full_fix.py - DiscoverPage.tsx 전체 수정 (git HEAD에서 시작)
1. 비ASCII 문자 제거 (? 로 교체)
2. TripGroup interface 닫는 } 삽입
3. FILTER_LIST 교체
4. filters.map → FILTER_LIST.map
5. activeFilter 초기값 "all"
6. 홀수 따옴표 줄 자동 닫기
7. template literal 잘린 줄 인라인화
"""
import re

file = r'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx'

with open(file, 'rb') as f:
    raw = f.read()

# UTF-8로 읽되 대체 문자 사용
text = raw.decode('utf-8', errors='replace')

lines = text.split('\n')
print(f'Total lines: {len(lines)}')

new_lines = []
i = 0
tripgroup_done = False

while i < len(lines):
    line = lines[i]
    cr = '\r' if line.endswith('\r') else ''
    base = line.rstrip('\r\n')
    
    # Step 1: 비ASCII 문자를 ASCII 대체 (? 로)
    # 주석 내 비ASCII는 그냥 제거
    def strip_nonascii(s):
        return ''.join(c if ord(c) < 128 else '?' for c in s)
    
    if any(ord(c) >= 128 for c in base):
        base = strip_nonascii(base)
    
    # Step 2: isPremiumGroup에서 주석 내 } 정리 + TripGroup 닫기
    if 'isPremiumGroup' in base and not tripgroup_done:
        # 줄 끝의 } 제거 (닫는 괄호가 주석에 포함된 경우)
        base_stripped = base.rstrip()
        if base_stripped.endswith('}'):
            base = base_stripped[:-1]
        new_lines.append(base + cr + '\n')
        # TripGroup interface 닫는 }
        new_lines.append('}' + cr + '\n')
        tripgroup_done = True
        i += 1
        continue
    
    # Step 3: const filters 교체
    if re.match(r'\s*const\s+filters\s*=', base):
        new_lines.append('const FILTER_LIST = ["all", "recruiting", "almostFull", "hot"] as const;' + cr + '\n')
        i += 1
        continue
    
    # Step 4: filters.map → FILTER_LIST.map
    if 'filters.map' in base:
        base = base.replace('filters.map', 'FILTER_LIST.map')
    
    # Step 5: activeFilter useState 초기값 수정
    if 'activeFilter' in base and 'useState' in base and ('???' in base or '?' in base):
        base = re.sub(r'useState\(".*?"\)', 'useState("all")', base)
    
    # Step 6: activeFilter 비교 수정
    if 'activeFilter ===' in base and '?' in base:
        base = re.sub(r'activeFilter === ".*?체.*?"', 'activeFilter === "all"', base)
        base = re.sub(r'activeFilter === ".*?모집.*?"', 'activeFilter === "recruiting"', base)
        base = re.sub(r'activeFilter === ".*?마감.*?"', 'activeFilter === "almostFull"', base)
        base = re.sub(r'activeFilter === ".*?급.*?"', 'activeFilter === "hot"', base)
    
    # Step 6b: 홀수 따옴표 닫기
    if '"' in base and not base.strip().startswith('//'):
        # 이스케이프 제외 따옴표 수
        temp = base.replace('\\"', '__Q__')
        q_count = temp.count('"')
        if q_count % 2 != 0:
            # 줄 끝에 따옴표 추가
            if base.rstrip().endswith(','):
                base = base.rstrip()[:-1] + '",'
            elif base.rstrip().endswith(';'):
                base = base.rstrip()[:-1] + '";'
            else:
                base = base.rstrip() + '"'
    
    new_lines.append(base + cr + '\n')
    i += 1

# Step 7: template literal 인라인화 (backtick 홀수이거나 ${ 닫히지 않은 줄)
def analyze(s):
    state = 'code'
    expr_depth = 0
    j = 0
    while j < len(s):
        c = s[j]
        if state == 'string':
            if c == '\\': j += 2; continue
            if c == str_char: state = 'code'
        elif state == 'template':
            if c == '\\': j += 2; continue  
            if c == '`': state = 'code'
            elif c == '$' and j+1 < len(s) and s[j+1] == '{': expr_depth += 1; j += 2; continue
            elif c == '}' and expr_depth > 0: expr_depth -= 1
        else:  # code
            if c in ('"', "'"): state = 'string'; str_char = c
            elif c == '`': state = 'template'
        j += 1
    return state, expr_depth

final_lines = []
i = 0
combined_count = 0

while i < len(new_lines):
    line = new_lines[i]
    cr = '\r' if line.endswith('\r\n') else ''
    base = line.rstrip('\r\n')
    
    state, expr_depth = analyze(base)
    if (state == 'template' or expr_depth > 0) and not base.strip().startswith('//'):
        combined = base
        j = i + 1
        while j < len(new_lines) and j < i + 15:
            next_base = new_lines[j].rstrip('\r\n')
            combined = combined + ' ' + next_base.strip()
            j += 1
            st, ed = analyze(combined)
            if st == 'code' and ed == 0:
                break
        
        st, ed = analyze(combined)
        if j > i + 1 and st == 'code' and ed == 0:
            combined_count += 1
            final_lines.append(combined + cr + '\n')
            i = j
            continue
    
    final_lines.append(line)
    i += 1

with open(file, 'w', encoding='utf-8') as f:
    f.write(''.join(final_lines))

print(f'Done. Lines: {len(final_lines)}')
print(f'TripGroup closed: {tripgroup_done}')
print(f'Template literals combined: {combined_count}')
