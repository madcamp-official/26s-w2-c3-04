// 프레임 테마 프리셋. FrameSelectionScreen(선택 화면)과 CompletionScreen(완성
// 화면)이 각자 색상표를 따로 갖고 있으면 서로 미묘하게 어긋날 수 있어서,
// 하나의 소스로 통합했다.

export interface ThemePreset {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export const THEMES: ThemePreset[] = [
  { id: 'heart', emoji: '💕', label: '하트', color: '#D8708C' },
  { id: 'space', emoji: '🌌', label: '우주', color: '#3A2E7C' },
  { id: 'birthday', emoji: '🎂', label: '생일', color: '#C97B3D' },
  { id: 'ocean', emoji: '🌊', label: '바다', color: '#1E7BAF' },
  { id: 'christmas', emoji: '🎄', label: '크리스마스', color: '#2E7D4F' },
  { id: 'simple', emoji: '🎨', label: '심플', color: '#6B6B6B' },
  { id: 'university', emoji: '🎓', label: '대학교', color: '#3C2A35' },
];

export const SIMPLE_COLORS = [
  { label: '로즈', value: '#E8869F' },
  { label: '라벤더', value: '#B39DDB' },
  { label: '민트', value: '#80CBC4' },
  { label: '선샤인', value: '#FFD54F' },
  { label: '피치', value: '#FFAB91' },
  { label: '스카이', value: '#81D4FA' },
  { label: '화이트', value: '#BFAFB5' },
  { label: '블랙', value: '#424242' },
];

export function findTheme(id: string): ThemePreset {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
