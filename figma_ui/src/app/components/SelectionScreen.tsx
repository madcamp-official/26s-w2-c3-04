import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, LayoutGrid, AlignJustify } from 'lucide-react';

interface SelectionScreenProps {
  photos: string[];
  layout: '1x4' | '2x2';
  onNext: (selectedIndices: number[], layout: '1x4' | '2x2') => void;
}

export function SelectionScreen({ photos, layout: initialLayout, onNext }: SelectionScreenProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [previewLayout, setPreviewLayout] = useState<'1x4' | '2x2'>(initialLayout);
  const MAX_SELECT = 4;

  const toggleSelect = (idx: number) => {
    if (selected.includes(idx)) {
      setSelected(selected.filter((i) => i !== idx));
    } else if (selected.length < MAX_SELECT) {
      setSelected([...selected, idx]);
    }
  };

  const canProceed = selected.length === MAX_SELECT;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFAF7' }}>
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid rgba(232, 134, 159, 0.15)' }}
      >
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#3C2A35', marginBottom: '4px' }}>
          StoryBooth
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3C2A35' }}>마음에 드는 사진 4장을 선택하세요</h2>
            <p style={{ fontSize: '0.82rem', color: '#9B7A8A', marginTop: '2px' }}>선택한 순서대로 네컷에 배치돼요</p>
          </div>
          {/* Selection counter */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: canProceed ? '#FDE8EF' : '#F5EEF0',
              border: `1.5px solid ${canProceed ? '#E8869F' : 'transparent'}`,
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: canProceed ? '#E8869F' : '#9B7A8A' }}>
              {selected.length}/{MAX_SELECT}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#9B7A8A' }}>선택됨</span>
          </div>
        </div>
      </div>

      {/* Layout toggle */}
      <div className="flex justify-end px-6 pt-4 pb-2 gap-2">
        <button
          onClick={() => setPreviewLayout('1x4')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
          style={{
            background: previewLayout === '1x4' ? '#E8869F' : '#F5EEF0',
            color: previewLayout === '1x4' ? '#FFFFFF' : '#9B7A8A',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
          }}
        >
          <AlignJustify size={12} />
          세로 1×4
        </button>
        <button
          onClick={() => setPreviewLayout('2x2')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
          style={{
            background: previewLayout === '2x2' ? '#E8869F' : '#F5EEF0',
            color: previewLayout === '2x2' ? '#FFFFFF' : '#9B7A8A',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 500,
          }}
        >
          <LayoutGrid size={12} />
          정방 2×2
        </button>
      </div>

      {/* Photo Grid */}
      <div className="flex-1 px-6 pb-4">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
          }}
        >
          {photos.map((gradient, idx) => {
            const selectionOrder = selected.indexOf(idx);
            const isSelected = selectionOrder !== -1;
            const isDisabled = !isSelected && selected.length >= MAX_SELECT;

            return (
              <motion.div
                key={idx}
                whileHover={!isDisabled ? { scale: 1.03, y: -2 } : {}}
                whileTap={!isDisabled ? { scale: 0.97 } : {}}
                onClick={() => toggleSelect(idx)}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: '3/4',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  border: isSelected ? '3px solid #E8869F' : '3px solid transparent',
                  boxShadow: isSelected
                    ? '0 8px 24px rgba(232, 134, 159, 0.35)'
                    : '0 4px 12px rgba(60, 42, 53, 0.08)',
                  opacity: isDisabled ? 0.4 : 1,
                  transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
                }}
              >
                <img
                  src={gradient}
                  alt={`촬영 사진 ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Selected badge */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        background: '#E8869F',
                        boxShadow: '0 2px 8px rgba(232, 134, 159, 0.6)',
                      }}
                    >
                      <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}>
                        {selectionOrder + 1}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover overlay */}
                {!isDisabled && !isSelected && (
                  <div
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: 'rgba(232, 134, 159, 0.15)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.8)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="#E8869F" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Selection order preview */}
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 rounded-2xl"
            style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(60, 42, 53, 0.08)', border: '1px solid rgba(232, 134, 159, 0.15)' }}
          >
            <p style={{ fontSize: '0.78rem', color: '#9B7A8A', marginBottom: '10px', fontWeight: 500 }}>
              선택 순서 미리보기
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: previewLayout === '1x4' ? '1fr' : '1fr 1fr',
                gap: previewLayout === '1x4' ? '4px' : '4px',
                width: previewLayout === '1x4' ? '60px' : '100px',
              }}
            >
              {Array.from({ length: MAX_SELECT }).map((_, i) => {
                const photoIdx = selected[i];
                return (
                  <div
                    key={i}
                    className="rounded-md overflow-hidden relative"
                    style={{
                      aspectRatio: '3/4',
                      background: photoIdx === undefined ? '#F5EEF0' : undefined,
                      border: photoIdx !== undefined ? '1.5px solid rgba(232,134,159,0.3)' : '1.5px dashed #E8D4DB',
                    }}
                  >
                    {photoIdx !== undefined && (
                      <img
                        src={photos[photoIdx]}
                        alt={`선택 ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    )}
                    {photoIdx !== undefined && (
                      <div
                        className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(232,134,159,0.9)' }}
                      >
                        <span style={{ fontSize: '0.55rem', color: '#FFFFFF', fontWeight: 800 }}>{i + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(232, 134, 159, 0.15)' }}
      >
        <p style={{ fontSize: '0.82rem', color: '#9B7A8A' }}>
          {canProceed ? '모두 선택됐어요! 프레임을 고를 차례예요 ✨' : `${MAX_SELECT - selected.length}장 더 선택하세요`}
        </p>
        <motion.button
          whileHover={canProceed ? { scale: 1.04 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
          onClick={() => canProceed && onNext(selected, previewLayout)}
          className="flex items-center gap-2 px-6 py-3 rounded-full transition-all"
          style={{
            background: canProceed
              ? 'linear-gradient(135deg, #E8869F, #D8708C)'
              : '#F0E4E8',
            color: canProceed ? '#FFFFFF' : '#C4A8B4',
            boxShadow: canProceed ? '0 6px 20px rgba(232, 134, 159, 0.4)' : 'none',
            border: 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          프레임 선택하기
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}
