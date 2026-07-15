import { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { ShootingScreen } from './components/ShootingScreen';
import { SelectionScreen } from './components/SelectionScreen';
import { FrameSelectionScreen } from './components/FrameSelectionScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { AnimatePresence, motion } from 'motion/react';

type Screen = 'start' | 'shooting' | 'selection' | 'frame' | 'completion';

interface AppState {
  layout: '1x4' | '2x2';
  photos: string[];
  selectedIndices: number[];
  theme: string;
  frameColor: string;
  frameTitle: string;
  logoDataUrl: string | null;
}

const INITIAL_STATE: AppState = {
  layout: '1x4',
  photos: [],
  selectedIndices: [],
  theme: '',
  frameColor: '#D8708C',
  frameTitle: '',
  logoDataUrl: null,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);

  const handleStart = (layout: '1x4' | '2x2') => {
    setAppState((s) => ({ ...s, layout }));
    setScreen('shooting');
  };

  const handleShootingComplete = (photos: string[]) => {
    setAppState((s) => ({ ...s, photos }));
    setScreen('selection');
  };

  const handleSelectionNext = (selectedIndices: number[], layout: '1x4' | '2x2') => {
    setAppState((s) => ({ ...s, selectedIndices, layout }));
    setScreen('frame');
  };

  const handleFrameComplete = (theme: string, frameColor: string, frameTitle: string, logoDataUrl: string | null) => {
    setAppState((s) => ({ ...s, theme, frameColor, frameTitle, logoDataUrl }));
    setScreen('completion');
  };

  const handleRestart = () => {
    setAppState(INITIAL_STATE);
    setScreen('start');
  };

  return (
    <div className="size-full" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="size-full"
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}

        {screen === 'shooting' && (
          <motion.div
            key="shooting"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="size-full"
          >
            <ShootingScreen
              layout={appState.layout}
              onComplete={handleShootingComplete}
            />
          </motion.div>
        )}

        {screen === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="size-full"
          >
            <SelectionScreen
              photos={appState.photos}
              layout={appState.layout}
              onNext={handleSelectionNext}
            />
          </motion.div>
        )}

        {screen === 'frame' && (
          <motion.div
            key="frame"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="size-full"
          >
            <FrameSelectionScreen
              photos={appState.photos}
              selectedIndices={appState.selectedIndices}
              layout={appState.layout}
              onComplete={handleFrameComplete}
            />
          </motion.div>
        )}

        {screen === 'completion' && (
          <motion.div
            key="completion"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="size-full"
          >
            <CompletionScreen
              photos={appState.photos}
              selectedIndices={appState.selectedIndices}
              layout={appState.layout}
              theme={appState.theme}
              frameColor={appState.frameColor}
              frameTitle={appState.frameTitle}
              logoDataUrl={appState.logoDataUrl}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
