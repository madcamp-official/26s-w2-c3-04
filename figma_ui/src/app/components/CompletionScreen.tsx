import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, RefreshCw, Heart, Loader2 } from 'lucide-react';
import { composeFinalImage, type Layout } from '../lib/compose';

interface CompletionScreenProps {
  photos: string[];
  selectedIndices: number[];
  layout: Layout;
  theme: string;
  frameColor: string;
  frameTitle: string;
  logoDataUrl: string | null;
  onRestart: () => void;
}

// Confetti particle
function ConfettiPiece({ delay, x }: { delay: number; x: number }) {
  const colors = ['#E8869F', '#FFD4C2', '#C5D9BF', '#D4E4F5', '#FFB347', '#B39DDB'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;

  return (
    <motion.div
      initial={{ y: -20, x, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: 500, opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
      transition={{ duration: 2 + Math.random() * 1.5, delay, ease: 'easeIn' }}
      style={{
        position: 'fixed', top: 0, left: 0, width: size, height: isCircle ? size : size * 0.5,
        background: color, borderRadius: isCircle ? '50%' : '2px', pointerEvents: 'none', zIndex: 100,
      }}
    />
  );
}

export function CompletionScreen({
  photos,
  selectedIndices,
  layout,
  frameColor,
  frameTitle,
  logoDataUrl,
  onRestart,
}: CompletionScreenProps) {
  const confettiPieces = useRef(
    Array.from({ length: 40 }, (_, i) => ({ id: i, x: Math.random() * window.innerWidth, delay: i * 0.05 }))
  );

  const selectedPhotos = selectedIndices.map((i) => photos[i]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [composing, setComposing] = useState(true);
  const [composeError, setComposeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setComposing(true);
    setComposeError(null);
    composeFinalImage({ photos: selectedPhotos, layout, frameColor, title: frameTitle, logoDataUrl })
      .then((dataUrl) => {
        if (!cancelled) {
          setResultUrl(dataUrl);
          setComposing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComposeError('이미지를 합성하는 중 문제가 생겼어요. 다시 시도해주세요.');
          setComposing(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // selectedPhotos는 매 렌더 새 배열이라 join으로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhotos.join(','), layout, frameColor, frameTitle, logoDataUrl]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `storybooth-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFAF7' }}>
      {!composing && !composeError && confettiPieces.current.map((p) => <ConfettiPiece key={p.id} delay={p.delay} x={p.x} />)}

      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(232, 134, 159, 0.15)' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#3C2A35' }}>
          StoryBooth
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-6 py-10">
        {/* Left: Result */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
              className="flex justify-center mb-4"
            >
              <div className="flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: '#FDE8EF', border: '1.5px solid rgba(232,134,159,0.4)' }}>
                <Heart size={14} fill="#E8869F" color="#E8869F" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E8869F' }}>
                  {composing ? '만드는 중...' : '네컷 완성!'}
                </span>
                <Heart size={14} fill="#E8869F" color="#E8869F" />
              </div>
            </motion.div>

            <div
              className="flex items-center justify-center"
              style={{
                width: layout === '2x2' ? '280px' : '180px',
                minHeight: '260px',
                padding: '14px',
                background: frameColor,
                borderRadius: '20px',
                boxShadow: `0 20px 60px ${frameColor}55, 0 4px 20px rgba(60,42,53,0.15)`,
              }}
            >
              {composing && <Loader2 className="animate-spin" size={28} color="#ffffff" />}
              {composeError && (
                <p style={{ color: '#ffffff', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.6 }}>{composeError}</p>
              )}
              {resultUrl && !composing && !composeError && (
                <img src={resultUrl} alt="완성된 네컷" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
              )}
            </div>
          </motion.div>
        </div>

        {/* Right: Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <div className="mb-2">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3C2A35', lineHeight: 1.3 }}>
              우리의 네컷이<br />완성됐어요 🎉
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9B7A8A', marginTop: '8px' }}>사진을 저장해보세요</p>
          </div>

          <motion.button
            whileHover={resultUrl ? { scale: 1.03, y: -2 } : {}}
            whileTap={resultUrl ? { scale: 0.97 } : {}}
            onClick={handleDownload}
            disabled={!resultUrl}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl"
            style={{
              background: resultUrl ? 'linear-gradient(135deg, #E8869F, #D8708C)' : '#F0E4E8',
              color: resultUrl ? '#FFFFFF' : '#C4A8B4',
              border: 'none',
              cursor: resultUrl ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: resultUrl ? '0 8px 24px rgba(232, 134, 159, 0.45)' : 'none',
            }}
          >
            <Download size={18} />
            네컷 저장하기
          </motion.button>

          <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid rgba(232,134,159,0.15)', boxShadow: '0 4px 12px rgba(60,42,53,0.06)' }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: '0.78rem', color: '#9B7A8A' }}>테마</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3C2A35' }}>{frameTitle}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: '0.78rem', color: '#9B7A8A' }}>레이아웃</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3C2A35' }}>{layout === '1x4' ? '세로 1×4' : '정방 2×2'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.78rem', color: '#9B7A8A' }}>촬영 날짜</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3C2A35' }}>
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl transition-all"
            style={{ background: '#F5EEF0', color: '#9B7A8A', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EEE0E5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5EEF0'; }}
          >
            <RefreshCw size={15} />
            새로운 네컷 찍기
          </button>
        </motion.div>
      </div>
    </div>
  );
}
