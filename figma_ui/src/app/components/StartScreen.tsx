import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface StartScreenProps {
  onStart: (layout: '1x4' | '2x2') => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [selectedLayout, setSelectedLayout] = useState<'1x4' | '2x2'>('1x4');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(160deg, #FFFAF7 0%, #FFF0F4 50%, #FFF8F5 100%)' }}
    >
      {/* Decorative background circles */}
      <div
        className="absolute top-16 left-16 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8869F, transparent)' }}
      />
      <div
        className="absolute bottom-24 right-20 w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FFD4C2, transparent)' }}
      />
      <div
        className="absolute top-1/3 right-10 w-20 h-20 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C5D9BF, transparent)' }}
      />

      {/* Logo — same static title style as the shooting screen header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center mb-10"
      >
        <h1
          style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '2.5rem', color: '#3C2A35' }}
        >
          StoryBooth
        </h1>
        <p style={{ color: '#9B7A8A', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          손동작만으로 찍는 나만의 인생네컷
        </p>
      </motion.div>

      {/* Layout Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg mb-10"
      >
        <p
          className="text-center mb-5"
          style={{ color: '#7B6070', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          레이아웃 선택
        </p>

        <div className="flex gap-5 justify-center">
          {/* 1x4 Layout Card */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedLayout('1x4')}
            className="relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-300"
            style={{
              background: selectedLayout === '1x4' ? '#FDE8EF' : '#FFFFFF',
              border: selectedLayout === '1x4' ? '2.5px solid #E8869F' : '2.5px solid #F5E4EA',
              boxShadow: selectedLayout === '1x4'
                ? '0 8px 32px rgba(232, 134, 159, 0.25)'
                : '0 4px 16px rgba(60, 42, 53, 0.06)',
              cursor: 'pointer',
              minWidth: '140px',
            }}
          >
            {selectedLayout === '1x4' && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#E8869F' }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            {/* 1x4 Preview Strip */}
            <div className="flex gap-1.5">
              <div
                className="rounded-lg overflow-hidden"
                style={{ width: '52px', display: 'flex', flexDirection: 'column', gap: '3px' }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded"
                    style={{
                      width: '52px',
                      height: '36px',
                      background: ['#FDE8EF', '#FFD4C2', '#C5D9BF', '#D4E4F5'][i],
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: '#3C2A35', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>세로 1×4</p>
              <p style={{ color: '#9B7A8A', fontSize: '0.72rem', textAlign: 'center', marginTop: '2px' }}>세로 스트립</p>
            </div>
          </motion.button>

          {/* 2x2 Layout Card */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedLayout('2x2')}
            className="relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-300"
            style={{
              background: selectedLayout === '2x2' ? '#FDE8EF' : '#FFFFFF',
              border: selectedLayout === '2x2' ? '2.5px solid #E8869F' : '2.5px solid #F5E4EA',
              boxShadow: selectedLayout === '2x2'
                ? '0 8px 32px rgba(232, 134, 159, 0.25)'
                : '0 4px 16px rgba(60, 42, 53, 0.06)',
              cursor: 'pointer',
              minWidth: '140px',
            }}
          >
            {selectedLayout === '2x2' && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#E8869F' }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            {/* 2x2 Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
              {['#FDE8EF', '#FFD4C2', '#C5D9BF', '#D4E4F5'].map((color, i) => (
                <div
                  key={i}
                  className="rounded"
                  style={{ width: '50px', height: '50px', background: color }}
                />
              ))}
            </div>

            <div>
              <p style={{ color: '#3C2A35', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>정방 2×2</p>
              <p style={{ color: '#9B7A8A', fontSize: '0.72rem', textAlign: 'center', marginTop: '2px' }}>그리드 배열</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
      >
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onStart(selectedLayout)}
          className="flex items-center gap-3 px-10 py-4 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #E8869F, #D8708C)',
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontWeight: 600,
            boxShadow: '0 8px 28px rgba(232, 134, 159, 0.45)',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          촬영 시작하기
          <ChevronRight size={18} />
        </motion.button>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{ color: '#C4A8B4', fontSize: '0.78rem', marginTop: '2rem', textAlign: 'center' }}
      >
        손동작을 카메라에 보여주면 자동으로 촬영돼요 ✌️
      </motion.p>
    </div>
  );
}
