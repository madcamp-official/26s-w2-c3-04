import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SkipForward } from 'lucide-react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { GESTURES, GUIDE_CAPTION, CHECKERS, buildShotSequence, type ShotDef, type Landmarks } from '../lib/handDetection';

interface ShootingScreenProps {
  layout: '1x4' | '2x2';
  onComplete: (photos: string[]) => void;
}

const COUNTDOWN_MS = 3000;
const RESET_GAP_MS = 1200;

type Phase = 'loading' | 'error' | 'waiting' | 'countdown' | 'captured';

// 카메라를 못 쓰는 상황(권한 거부 등)을 위한 대체 이미지 — 실제 촬영은 아니지만
// 최소한 다음 화면들을 테스트/시연할 수 있게 해줌
function buildPlaceholderPhoto(index: number): string {
  const gradients = [
    ['#FDE8EF', '#FFD4C2'], ['#D4E4F5', '#C5D9BF'], ['#FFF0D4', '#FFD4C2'], ['#E8EFF5', '#D4E4F5'],
    ['#F5E8F5', '#FDE8EF'], ['#C5D9BF', '#D4E4F5'], ['#FFD4C2', '#FFF0D4'], ['#FDE8EF', '#E8EFF5'],
  ];
  const [c1, c2] = gradients[index % gradients.length];
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function ShootingScreen({ onComplete }: ShootingScreenProps) {
  const [sequence] = useState<ShotDef[]>(() => buildShotSequence());
  const totalShots = sequence.length; // 8 (4 동작 x 2회)

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);

  // 감지 루프 내부에서만 쓰는 값들은 ref로 관리해서(리렌더와 무관하게 최신값 유지)
  // requestAnimationFrame 재귀 콜백의 stale closure 문제를 피함
  const currentIdxRef = useRef(0);
  const inResetGapRef = useRef(false);
  const countdownStartRef = useRef<number | null>(null);
  const capturedRef = useRef<string[]>([]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [currentShot, setCurrentShot] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [statusText, setStatusText] = useState('카메라를 불러오는 중입니다');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current!;
    const tmp = document.createElement('canvas');
    tmp.width = video.videoWidth;
    tmp.height = video.videoHeight;
    const tctx = tmp.getContext('2d')!;
    // 거울모드로 저장 (화면에 보이는 대로)
    tctx.translate(tmp.width, 0);
    tctx.scale(-1, 1);
    tctx.drawImage(video, 0, 0, tmp.width, tmp.height);
    const dataUrl = tmp.toDataURL('image/jpeg', 0.92);

    const nextPhotos = [...capturedRef.current, dataUrl];
    capturedRef.current = nextPhotos;
    setCapturedPhotos(nextPhotos);
    setShowFlash(true);
    setPhase('captured');
    setTimeout(() => setShowFlash(false), 500);

    countdownStartRef.current = null;
    const nextIdx = currentIdxRef.current + 1;
    currentIdxRef.current = nextIdx;

    if (nextIdx >= totalShots) {
      setStatusText('8장 촬영 완료! 선택 화면으로 이동합니다');
      setTimeout(() => onComplete(nextPhotos), 700);
      return;
    }

    inResetGapRef.current = true;
    setCurrentShot(nextIdx);
    setPhase('waiting');
    setStatusText('손을 한 번 내려주세요');
    setTimeout(() => {
      inResetGapRef.current = false;
    }, RESET_GAP_MS);
  }, [onComplete, totalShots]);

  const handleDetection = useCallback(
    (ok: boolean, handCount: number, minHands: number) => {
      const countInfo = handCount > 0 ? ` · 감지된 손 ${handCount}개` : ' · 손이 감지되지 않음';

      if (countdownStartRef.current !== null) {
        if (!ok) {
          countdownStartRef.current = null;
          setPhase('waiting');
          setStatusText(`자세가 풀렸어요. 모든 사람이 다시 동작을 만들어주세요${countInfo}`);
          return;
        }
        const elapsed = performance.now() - countdownStartRef.current;
        if (elapsed >= COUNTDOWN_MS) {
          capturePhoto();
        } else {
          setPhase('countdown');
          setCountdownNum(Math.max(Math.ceil((COUNTDOWN_MS - elapsed) / 1000), 1));
        }
        return;
      }

      if (ok) {
        countdownStartRef.current = performance.now();
        setPhase('countdown');
        setCountdownNum(3);
      } else {
        setPhase('waiting');
        const needMsg = minHands > 1 ? ` (최소 ${minHands}개 손 필요)` : '';
        setStatusText(`동작을 인식하는 중...${needMsg}${countInfo}`);
      }
    },
    [capturePhoto]
  );

  const drawOverlay = useCallback((hands: Landmarks[], ok: boolean) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.fillStyle = ok ? '#5ee08a' : '#ffd54a';
    for (const hand of hands) {
      for (const pt of hand) {
        octx.beginPath();
        octx.arc(pt.x * overlay.width, pt.y * overlay.height, 3, 0, Math.PI * 2);
        octx.fill();
      }
    }
  }, []);

  const loop = useCallback(() => {
    const landmarker = handLandmarkerRef.current;
    const video = videoRef.current;
    if (!landmarker || !video || currentIdxRef.current >= totalShots) return;

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const hands = (result.landmarks || []) as Landmarks[];
      const handednesses = (result.handednesses || []).map(
        (h) => (h && h[0] && h[0].categoryName) || 'Right'
      );
      const gestureDef = sequence[currentIdxRef.current];
      const ok = !inResetGapRef.current && CHECKERS[gestureDef.id](hands, handednesses);
      drawOverlay(hands, ok);
      if (!inResetGapRef.current) {
        handleDetection(ok, hands.length, gestureDef.minHands);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [sequence, totalShots, drawOverlay, handleDetection]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
        if (overlayRef.current) {
          overlayRef.current.width = video.videoWidth;
          overlayRef.current.height = video.videoHeight;
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(
          '카메라를 사용할 수 없습니다. 브라우저 주소창의 카메라 권한을 확인해주세요. (https 주소로 접속해야 카메라가 열립니다)'
        );
        setPhase('error');
        return;
      }

      try {
        setStatusText('AI 모델을 불러오는 중입니다...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 6,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        handLandmarkerRef.current = landmarker;
        setPhase('waiting');
        setStatusText('동작을 인식하는 중...');
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg('AI 모델을 불러오지 못했습니다. 네트워크 상태를 확인하고 새로고침 해주세요.');
        setPhase('error');
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const placeholders = Array.from({ length: totalShots }, (_, i) => buildPlaceholderPhoto(i));
    onComplete(placeholders);
  };

  const gesture = GESTURES.find((g) => g.id === sequence[currentShot]?.id) || GESTURES[0];
  const gestureCaption = GUIDE_CAPTION[sequence[currentShot]?.id] || '';

  const statusColors: Record<Phase, string> = {
    loading: '#9B7A8A',
    error: '#E8869F',
    waiting: '#9B7A8A',
    countdown: '#E8869F',
    captured: '#5AB380',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFAF7' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(232, 134, 159, 0.15)' }}
      >
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#3C2A35' }}>
          StoryBooth
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalShots }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentShot ? '20px' : '8px',
                height: '8px',
                background: i < capturedPhotos.length ? '#E8869F' : i === currentShot ? '#E8869F' : '#F5E4EA',
                opacity: i > currentShot ? 0.4 : 1,
              }}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all"
          style={{ background: '#F5EEF0', color: '#9B7A8A', fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}
        >
          <SkipForward size={12} />
          건너뛰기
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 gap-5">
        {/* Gesture instruction */}
        {phase !== 'error' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentShot}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <span style={{ fontSize: '2rem' }}>{gesture.name.split(' ').pop()}</span>
                <div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3C2A35' }}>
                    {gesture.name.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#9B7A8A' }}>{gestureCaption}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Shot counter badge */}
        {phase !== 'error' && (
          <div className="px-4 py-1.5 rounded-full" style={{ background: '#FDE8EF', border: '1px solid rgba(232,134,159,0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: '#E8869F', fontWeight: 600 }}>
              {currentShot + 1} / {totalShots} 번째 촬영
            </span>
          </div>
        )}

        {/* Camera preview area */}
        <div className="relative w-full max-w-sm">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: '3/4',
              borderRadius: '24px',
              background: 'linear-gradient(160deg, #2A1E26 0%, #1A1320 100%)',
              boxShadow: '0 20px 60px rgba(60, 42, 53, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '3px solid rgba(232, 134, 159, 0.3)',
            }}
          >
            {/* 실제 웹캠 영상 (거울모드) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* 손 관절 오버레이 (실제 인식 결과) */}
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />

            {phase === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p style={{ color: '#FFD4C2', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 }}>
                  {errorMsg}
                </p>
              </div>
            )}

            {phase === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}
                >
                  {statusText}
                </motion.div>
              </div>
            )}

            {/* Countdown overlay */}
            <AnimatePresence>
              {phase === 'countdown' && (
                <motion.div
                  key={countdownNum}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: '90px',
                      height: '90px',
                      background: 'rgba(232, 134, 159, 0.9)',
                      boxShadow: '0 0 40px rgba(232, 134, 159, 0.6)',
                    }}
                  >
                    <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'Poppins, sans-serif' }}>
                      {countdownNum}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Captured flash */}
            <AnimatePresence>
              {showFlash && (
                <motion.div
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: '#FFFFFF', pointerEvents: 'none' }}
                />
              )}
            </AnimatePresence>

            {/* Corner guides */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-5 h-5`}
                style={{
                  borderTop: i < 2 ? '2px solid rgba(232,134,159,0.5)' : 'none',
                  borderBottom: i >= 2 ? '2px solid rgba(232,134,159,0.5)' : 'none',
                  borderLeft: i % 2 === 0 ? '2px solid rgba(232,134,159,0.5)' : 'none',
                  borderRight: i % 2 === 1 ? '2px solid rgba(232,134,159,0.5)' : 'none',
                  borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>

          {/* Captured thumbnails strip */}
          {capturedPhotos.length > 0 && (
            <div className="flex gap-1.5 mt-3 justify-center flex-wrap">
              {capturedPhotos.map((src, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden"
                  style={{ width: '36px', height: '36px', border: '2px solid rgba(232,134,159,0.4)', boxShadow: '0 2px 8px rgba(60,42,53,0.1)' }}
                >
                  <img src={src} alt={`촬영 ${i + 1}`} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <motion.div
          key={phase + statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm px-5 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(60, 42, 53, 0.08)', border: '1px solid rgba(232, 134, 159, 0.15)' }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: statusColors[phase],
              boxShadow: `0 0 6px ${statusColors[phase]}`,
              animation: phase === 'waiting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '0.85rem', color: '#5A4050', fontWeight: 500 }}>{statusText}</span>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
