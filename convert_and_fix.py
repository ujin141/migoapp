import re
import subprocess
import sys

file_path = 'c:/Users/ujin1/Desktop/MIGO/MigoApp/src/pages/DiscoverPage.tsx'

# 1. git checkout으로 복구
subprocess.run(['git', 'checkout', 'HEAD', '--', 'src/pages/DiscoverPage.tsx'],
               cwd='c:/Users/ujin1/Desktop/MIGO/MigoApp')

# 2. git에서 초기 커밋(73e15b5)의 파일을 EUC-KR로 읽어 UTF-8로 저장
result = subprocess.run(
    ['git', 'show', '73e15b5:src/pages/DiscoverPage.tsx'],
    cwd='c:/Users/ujin1/Desktop/MIGO/MigoApp',
    capture_output=True
)
raw_data = result.stdout
try:
    text = raw_data.decode('euc-kr')
    print('Decoded as EUC-KR')
except:
    try:
        text = raw_data.decode('cp949')
        print('Decoded as CP949')
    except:
        text = raw_data.decode('utf-8', errors='replace')
        print('Decoded as UTF-8 with replacement')

# 3. 이중 줄바꿈 제거
text = text.replace('\r\r', '\r')

# 4. 파일을 줄 단위로 처리
lines = text.split('\n')
new_lines = []
i = 0
tripgroup_closed = False

while i < len(lines):
    line = lines[i]
    cr = '\r' if '\r' in line else ''
    
    # isPremiumGroup 줄에서 손상된 주석 내 } 제거, 그리고 interface 닫기
    if 'isPremiumGroup' in line and '}' in line and '?' in line:
        # 줄에서 주석 이후의 } 제거
        clean = line.rstrip().rstrip('\r')
        # 줄 끝의 } 제거
        if clean.endswith('}'):
            clean = clean[:-1]
        new_lines.append(clean + cr + '\n')
        # } 를 다음 줄로 삽입
        new_lines.append('}' + cr + '\n')
        tripgroup_closed = True
        i += 1
        continue
    
    # const filters = [...] 줄 교체
    stripped = line.strip()
    if re.match(r'const\s+filters\s*=', stripped):
        new_lines.append('const FILTER_LIST = ["all", "recruiting", "almostFull", "hot"] as const;' + cr + '\n')
        i += 1
        continue
    
    # filters.map 참조 교체
    if 'filters.map' in line:
        new_lines.append(line.replace('filters.map', 'FILTER_LIST.map'))
        i += 1
        continue
    
    # useState activeFilter 초기값 수정
    if 'activeFilter' in line and 'useState' in line and '?' in line:
        fixed = re.sub(r'useState\(".*?"\)', 'useState("all")', line.rstrip().rstrip('\r'))
        new_lines.append(fixed + cr + '\n')
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

# 5. UTF-8로 저장
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(''.join(new_lines))

print(f'Done. Lines: {len(new_lines)}')
print(f'TripGroup closed: {tripgroup_closed}')
