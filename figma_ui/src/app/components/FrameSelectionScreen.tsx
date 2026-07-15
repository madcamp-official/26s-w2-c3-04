import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Check, X, Upload } from 'lucide-react';
import { THEMES, SIMPLE_COLORS, findTheme } from '../lib/themes';
import {
  searchUniversities,
  getUniversityDisplayNames,
  getLogoOverride,
  saveLogoOverride,
  type UniversityPreset,
} from '../lib/university';

interface FrameSelectionScreenProps {
  photos: string[];
  selectedIndices: number[];
  layout: '1x4' | '2x2';
  // frameColor/frameTitle/logoDataUrl까지 여기서 확정해서 넘겨줘야 CompletionScreen이
  // 별도 조회 없이 바로 최종 이미지를 합성할 수 있음
  onComplete: (theme: string, frameColor: string, frameTitle: string, logoDataUrl: string | null) => void;
}

export function FrameSelectionScreen({ photos, selectedIndices, layout, onComplete }: FrameSelectionScreenProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('heart');
  const [simpleColor, setSimpleColor] = useState('#E8869F');
  const [uniSearch, setUniSearch] = useState('');
  const [selectedUni, setSelectedUni] = useState<UniversityPreset | null>(null);
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [customText, setCustomText] = useState('');
  const [uniLogo, setUniLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const filteredUnis = useMemo(() => searchUniversities(uniSearch), [uniSearch]);

  const selectedPhotos = selectedIndices.map((i) => photos[i]);
  const activeTheme = findTheme(selectedTheme);

  const getFrameColor = () => {
    if (selectedTheme === 'simple') return simpleColor;
    if (selectedTheme === 'university' && selectedUni) return selectedUni.color;
    return activeTheme.color;
  };

  const getFrameLabel = () => {
    if (selectedTheme === 'university' && selectedUni) return getUniversityDisplayNames(selectedUni).shortName;
    return activeTheme.label;
  };

  const canProceed = selectedTheme !== 'university' || selectedUni !== null;

  const handlePickUniversity = (uni: UniversityPreset) => {
    setSelectedUni(uni);
    setUniSearch(getUniversityDisplayNames(uni).fullName);
    setShowUniDropdown(false);
    setUniLogo(getLogoOverride(uni.key));
  };

  const handleLogoUpload = (file: File) => {
    if (!selectedUni) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      saveLogoOverride(selectedUni.key, dataUrl);
      setUniLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!canProceed) return;
    const frameColor = getFrameColor();
    const frameTitle =
      selectedTheme === 'university' && selectedUni ? selectedUni.englishName : `StoryBooth · ${activeTheme.label}`;
    const logoDataUrl = selectedTheme === 'university' ? uniLogo : null;
    onComplete(selectedTheme, frameColor, frameTitle, logoDataUrl);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#FFFAF7' }}>
      {/* Left Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(232, 134, 159, 0.15)' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#3C2A35', marginBottom: '4px' }}>
            StoryBooth
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3C2A35' }}>프레임 테마 선택</h2>
          <p style={{ fontSize: '0.82rem', color: '#9B7A8A', marginTop: '2px' }}>네컷을 꾸밀 테마를 골라보세요</p>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Theme Chips */}
          <div>
            <p style={{ fontSize: '0.8rem', color: '#9B7A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              테마 선택
            </p>
            <div className="flex flex-wrap gap-2.5">
              {THEMES.map((theme) => {
                const isActive = selectedTheme === theme.id;
                return (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      if (theme.id !== 'university') setShowUniDropdown(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                    style={{
                      background: isActive ? '#FDE8EF' : '#FFFFFF',
                      border: isActive ? '2px solid #E8869F' : '2px solid #F0E4E8',
                      color: isActive ? '#E8869F' : '#5A4050',
                      boxShadow: isActive ? '0 4px 14px rgba(232, 134, 159, 0.3)' : '0 2px 8px rgba(60, 42, 53, 0.05)',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.88rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{theme.emoji}</span>
                    {theme.label}
                    {isActive && <Check size={13} color="#E8869F" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* University Search */}
          <AnimatePresence>
            {selectedTheme === 'university' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: -16 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: '#FFFFFF', border: '1.5px solid rgba(232, 134, 159, 0.25)', boxShadow: '0 4px 16px rgba(60, 42, 53, 0.06)' }}
                >
                  <p style={{ fontSize: '0.82rem', color: '#9B7A8A', marginBottom: '10px', fontWeight: 500 }}>
                    🎓 학교를 검색하세요
                  </p>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search size={15} color="#C4A8B4" />
                    </div>
                    <input
                      type="text"
                      placeholder="예: 서울대, 연세대, 고려대..."
                      value={uniSearch}
                      onChange={(e) => {
                        setUniSearch(e.target.value);
                        setShowUniDropdown(true);
                        if (selectedUni && !e.target.value) setSelectedUni(null);
                      }}
                      onFocus={() => setShowUniDropdown(true)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl outline-none"
                      style={{ background: '#FFF5F8', border: '1.5px solid rgba(232, 134, 159, 0.25)', fontSize: '0.88rem', color: '#3C2A35' }}
                    />
                    {uniSearch && (
                      <button
                        onClick={() => { setUniSearch(''); setSelectedUni(null); setShowUniDropdown(false); setUniLogo(null); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} color="#C4A8B4" />
                      </button>
                    )}
                  </div>

                  {/* Selected university badge + 로고 업로드 */}
                  {selectedUni && !showUniDropdown && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FDE8EF', border: '1.5px solid rgba(232, 134, 159, 0.3)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: selectedUni.color }}>
                          {uniLogo ? (
                            <img src={uniLogo} alt="로고" className="w-full h-full object-contain" />
                          ) : (
                            <span style={{ color: '#FFFFFF', fontSize: '0.6rem', fontWeight: 800 }}>{selectedUni.initial}</span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3C2A35' }}>
                            {getUniversityDisplayNames(selectedUni).fullName}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: '#9B7A8A' }}>프레임 색상: {selectedUni.color}</p>
                        </div>
                        <Check size={16} color="#7DC9A0" style={{ marginLeft: 'auto' }} />
                      </div>

                      {/* 로고 업로드 */}
                      <div className="flex items-center gap-2 px-1">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                          style={{ background: '#F5EEF0', color: '#5A4050', border: 'none', cursor: 'pointer', fontSize: '0.74rem' }}
                        >
                          <Upload size={12} />
                          {uniLogo ? '로고 다시 올리기' : '로고 이미지 올리기 (선택)'}
                        </button>
                        <span style={{ fontSize: '0.68rem', color: '#C4A8B4' }}>
                          실제 교표는 상표물이라 직접 넣지 않았어요. 갖고 계신 로고 파일을 올리면 반영돼요.
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Dropdown results */}
                  <AnimatePresence>
                    {showUniDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 rounded-xl overflow-hidden"
                        style={{ maxHeight: '200px', overflowY: 'auto', background: '#FFFFFF', border: '1.5px solid rgba(232, 134, 159, 0.2)', boxShadow: '0 8px 24px rgba(60, 42, 53, 0.1)' }}
                      >
                        {filteredUnis.length === 0 ? (
                          <div className="px-4 py-3">
                            <p style={{ fontSize: '0.82rem', color: '#C4A8B4' }}>검색 결과가 없어요</p>
                          </div>
                        ) : (
                          filteredUnis.map((uni) => {
                            const names = getUniversityDisplayNames(uni);
                            return (
                              <button
                                key={uni.key}
                                onClick={() => handlePickUniversity(uni)}
                                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                                style={{
                                  background: selectedUni?.key === uni.key ? '#FDE8EF' : 'transparent',
                                  border: 'none',
                                  borderBottom: '1px solid rgba(232, 134, 159, 0.1)',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedUni?.key !== uni.key) (e.currentTarget as HTMLButtonElement).style.background = '#FFF5F8';
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedUni?.key !== uni.key) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                }}
                              >
                                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: uni.color }}>
                                  <span style={{ color: '#FFFFFF', fontSize: '0.55rem', fontWeight: 800 }}>{uni.initial}</span>
                                </div>
                                <div>
                                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#3C2A35' }}>{names.fullName}</p>
                                  <p style={{ fontSize: '0.72rem', color: '#9B7A8A' }}>{names.shortName}</p>
                                </div>
                                {selectedUni?.key === uni.key && <Check size={14} color="#E8869F" style={{ marginLeft: 'auto' }} />}
                              </button>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simple color picker */}
          <AnimatePresence>
            {selectedTheme === 'simple' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1.5px solid rgba(232, 134, 159, 0.25)', boxShadow: '0 4px 16px rgba(60, 42, 53, 0.06)' }}>
                  <p style={{ fontSize: '0.82rem', color: '#9B7A8A', marginBottom: '12px', fontWeight: 500 }}>🎨 프레임 색상 선택</p>
                  <div className="flex flex-wrap gap-3">
                    {SIMPLE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setSimpleColor(c.value)}
                        className="flex flex-col items-center gap-1.5"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={c.label}
                      >
                        <div
                          className="rounded-full transition-all"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: c.value,
                            border: simpleColor === c.value ? '3px solid #E8869F' : '3px solid transparent',
                            boxShadow: simpleColor === c.value ? '0 0 0 2px #FDE8EF, 0 4px 10px rgba(60,42,53,0.15)' : '0 2px 6px rgba(60,42,53,0.12)',
                            transform: simpleColor === c.value ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                        <span style={{ fontSize: '0.65rem', color: '#9B7A8A' }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom text (참고용 메모 — 별도 AI 생성 백엔드에 연결하려면 이 값을 그 서버로 전달하면 됨) */}
          <div>
            <p style={{ fontSize: '0.8rem', color: '#9B7A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              메모 <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: '0.75rem' }}>(선택사항)</span>
            </p>
            <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1.5px solid rgba(232, 134, 159, 0.2)', boxShadow: '0 4px 16px rgba(60, 42, 53, 0.06)' }}>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="이번 네컷에 대한 짧은 메모를 남겨보세요 (완성 화면에는 반영되지 않아요)"
                className="w-full outline-none resize-none"
                rows={3}
                style={{ background: 'transparent', border: 'none', fontSize: '0.88rem', color: '#3C2A35', lineHeight: 1.6 }}
              />
              <div className="flex items-center justify-end mt-2">
                <span style={{ fontSize: '0.72rem', color: customText.length > 200 ? '#E8869F' : '#C4A8B4' }}>
                  {customText.length}/200
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-6 py-5 mt-auto flex items-center justify-between" style={{ borderTop: '1px solid rgba(232, 134, 159, 0.15)' }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3C2A35' }}>
              {activeTheme.emoji} {getFrameLabel()} 프레임
            </p>
            {selectedTheme === 'university' && !selectedUni && (
              <p style={{ fontSize: '0.75rem', color: '#E8869F' }}>학교를 먼저 선택해 주세요</p>
            )}
          </div>
          <motion.button
            whileHover={canProceed ? { scale: 1.04 } : {}}
            whileTap={canProceed ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-full"
            style={{
              background: canProceed ? 'linear-gradient(135deg, #E8869F, #D8708C)' : '#F0E4E8',
              color: canProceed ? '#FFFFFF' : '#C4A8B4',
              boxShadow: canProceed ? '0 6px 20px rgba(232, 134, 159, 0.4)' : 'none',
              border: 'none',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            네컷 완성하기
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>

      {/* Right panel: Live Preview (실제 촬영한 사진으로 미리보기) */}
      <div className="lg:w-72 xl:w-80 flex-shrink-0 p-6 flex flex-col gap-4" style={{ borderLeft: '1px solid rgba(232, 134, 159, 0.15)', background: '#FFFFFF' }}>
        <p style={{ fontSize: '0.8rem', color: '#9B7A8A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>미리보기</p>

        <div className="flex justify-center">
          <div
            className="relative"
            style={{ padding: '10px', background: getFrameColor(), borderRadius: '16px', boxShadow: `0 8px 32px ${getFrameColor()}44` }}
          >
            <div className="text-center py-1.5 mb-1.5" style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {getFrameLabel() || 'StoryBooth'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: layout === '2x2' ? '1fr 1fr' : '1fr',
                gap: '5px',
                width: layout === '2x2' ? '180px' : '100px',
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => {
                const photoSrc = selectedPhotos[i];
                return (
                  <div key={i} className="rounded-md overflow-hidden relative" style={{ aspectRatio: '3/4', background: '#F5EEF0' }}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={`선택 ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>📷</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-1.5 mt-1" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em' }}>
              STORYBOOTH · {new Date().getFullYear()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF5F8', border: '1px solid rgba(232,134,159,0.2)' }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: getFrameColor(), boxShadow: `0 2px 8px ${getFrameColor()}66` }} />
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3C2A35' }}>
              {activeTheme.emoji} {getFrameLabel() || activeTheme.label}
            </p>
            <p style={{ fontSize: '0.7rem', color: '#9B7A8A' }}>
              {selectedTheme === 'university' && selectedUni
                ? getUniversityDisplayNames(selectedUni).fullName
                : selectedTheme === 'simple'
                ? `색상: ${simpleColor}`
                : `${activeTheme.label} 테마 적용됨`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
