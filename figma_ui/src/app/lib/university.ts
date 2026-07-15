// 대학교 프레임 데이터 — univ_ver3.html의 UNIVERSITY_PRESETS를 그대로 이식.
// 실제 학교 로고(교표)는 상표물이라 여기 코드에 직접 넣지 않았고, 사용자가
// 로고 이미지를 업로드하면 브라우저에 저장해서 재사용하는 방식만 제공한다.

export interface UniversityPreset {
  key: string;
  aliases: string[];
  color: string;
  englishName: string;
  initial: string;
}

export const UNIVERSITY_PRESETS: UniversityPreset[] = [
  { key: 'snu', aliases: ['서울대', '서울대학교', 'snu', 'seoul national university'], color: '#003876', englishName: 'SEOUL NATIONAL UNIVERSITY', initial: 'SNU' },
  { key: 'yonsei', aliases: ['연세대', '연세대학교', 'yonsei', 'yonsei university'], color: '#00205b', englishName: 'YONSEI UNIVERSITY', initial: 'Y' },
  { key: 'korea', aliases: ['고려대', '고려대학교', 'ku', 'korea university'], color: '#8b1e3f', englishName: 'KOREA UNIVERSITY', initial: 'KU' },
  { key: 'kaist', aliases: ['카이스트', 'kaist'], color: '#0a3161', englishName: 'KAIST', initial: 'K' },
  { key: 'hanyang', aliases: ['한양대', '한양대학교', 'hanyang', 'hanyang university'], color: '#004a93', englishName: 'HANYANG UNIVERSITY', initial: 'H' },
  { key: 'ewha', aliases: ['이화여대', '이화여자대학교', 'ewha', 'ewha womans university'], color: '#1f5c3f', englishName: 'EWHA WOMANS UNIVERSITY', initial: 'E' },
  { key: 'skku', aliases: ['성균관대', '성균관대학교', 'skku', 'sungkyunkwan university'], color: '#002855', englishName: 'SUNGKYUNKWAN UNIVERSITY', initial: 'SKKU' },
  { key: 'sogang', aliases: ['서강대', '서강대학교', 'sogang', 'sogang university'], color: '#b0212f', englishName: 'SOGANG UNIVERSITY', initial: 'S' },
  { key: 'cau', aliases: ['중앙대', '중앙대학교', 'cau', 'chung-ang university', 'chungang university'], color: '#0f2b5c', englishName: 'CHUNG-ANG UNIVERSITY', initial: 'CAU' },
  { key: 'khu', aliases: ['경희대', '경희대학교', 'khu', 'kyung hee university'], color: '#6f1d3c', englishName: 'KYUNG HEE UNIVERSITY', initial: 'KHU' },
  { key: 'hufs', aliases: ['한국외대', '한국외국어대학교', '외대', 'hufs', 'hankuk university of foreign studies'], color: '#003d7c', englishName: 'HANKUK UNIVERSITY OF FOREIGN STUDIES', initial: 'HUFS' },
  { key: 'uos', aliases: ['서울시립대', '서울시립대학교', 'uos', 'university of seoul'], color: '#004b93', englishName: 'UNIVERSITY OF SEOUL', initial: 'UOS' },
  { key: 'konkuk', aliases: ['건국대', '건국대학교', 'konkuk', 'konkuk university'], color: '#006241', englishName: 'KONKUK UNIVERSITY', initial: 'KU' },
  { key: 'dongguk', aliases: ['동국대', '동국대학교', 'dongguk', 'dongguk university'], color: '#6a1b2e', englishName: 'DONGGUK UNIVERSITY', initial: 'DGU' },
  { key: 'hongik', aliases: ['홍익대', '홍익대학교', 'hongik', 'hongik university'], color: '#c8102e', englishName: 'HONGIK UNIVERSITY', initial: 'HU' },
  { key: 'sookmyung', aliases: ['숙명여대', '숙명여자대학교', 'sookmyung', "sookmyung women's university"], color: '#4b1e6d', englishName: "SOOKMYUNG WOMEN'S UNIVERSITY", initial: 'SM' },
  { key: 'kookmin', aliases: ['국민대', '국민대학교', 'kookmin', 'kookmin university'], color: '#003876', englishName: 'KOOKMIN UNIVERSITY', initial: 'KMU' },
  { key: 'postech', aliases: ['포항공대', '포스텍', 'postech', 'pohang university of science and technology'], color: '#a6192e', englishName: 'POSTECH', initial: 'P' },
  { key: 'pusan', aliases: ['부산대', '부산대학교', 'pnu', 'pusan national university'], color: '#003876', englishName: 'PUSAN NATIONAL UNIVERSITY', initial: 'PNU' },
  { key: 'unist', aliases: ['유니스트', '울산과학기술원', 'unist', 'ulsan national institute of science and technology'], color: '#001c54', englishName: 'UNIST', initial: 'U' },
  { key: 'dgist', aliases: ['디지스트', '대구경북과학기술원', 'dgist', 'daegu gyeongbuk institute of science and technology'], color: '#0a1a3a', englishName: 'DGIST', initial: 'D' },
];

function normalizeUnivQuery(str: string) {
  return str.toLowerCase().replace(/\s|대학교|대학|학교/g, '');
}

export function findUniversity(query: string): UniversityPreset | null {
  const q = normalizeUnivQuery(query);
  if (!q) return null;
  for (const u of UNIVERSITY_PRESETS) {
    if (u.aliases.some((a) => normalizeUnivQuery(a) === q)) return u;
  }
  for (const u of UNIVERSITY_PRESETS) {
    if (
      u.aliases.some((a) => {
        const na = normalizeUnivQuery(a);
        return na.includes(q) || q.includes(na);
      })
    )
      return u;
  }
  return null;
}

// 검색 드롭다운용 - 조건에 맞는 모든 학교를 반환 (findUniversity는 첫 매치 하나만 반환)
export function searchUniversities(query: string): UniversityPreset[] {
  const q = normalizeUnivQuery(query);
  if (!q) return UNIVERSITY_PRESETS;
  return UNIVERSITY_PRESETS.filter((u) => u.aliases.some((a) => normalizeUnivQuery(a).includes(q)));
}

// aliases[0]=짧은 한글명, aliases[1]=정식 한글명 순서로 데이터가 들어있음
export function getUniversityDisplayNames(u: UniversityPreset) {
  return { shortName: u.aliases[0], fullName: u.aliases[1] };
}

// 사용자가 업로드한 로고를 학교 key 기준으로 브라우저에 저장 (한 번 올리면 재사용됨)
const UNIV_LOGO_STORAGE_KEY = 'aiFourCutUniversityLogos';

export function loadLogoOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(UNIV_LOGO_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLogoOverride(key: string, dataUrl: string) {
  const all = loadLogoOverrides();
  all[key] = dataUrl;
  localStorage.setItem(UNIV_LOGO_STORAGE_KEY, JSON.stringify(all));
}

export function getLogoOverride(key: string): string | null {
  return loadLogoOverrides()[key] || null;
}
