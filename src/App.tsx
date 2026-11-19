import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { INVITATION_CONFIG } from './config/invitationConfig';
import { FloatingPetals } from './components/FloatingPetals';
import { IntroOverlay } from './components/IntroOverlay';
import { MusicPlayer } from './components/MusicPlayer';
import { QRGenerator } from './components/QRGenerator';
import { EnvelopeScene } from './components/EnvelopeScene';
import { StoryScene } from './components/StoryScene';
import { AboutBekScene } from './components/AboutBekScene';
import { RomanticTransition } from './components/RomanticTransition';
import { InvitationScene } from './components/InvitationScene';
import { DatePickerScene, type CompletedDateSelection } from './components/DatePickerScene';
import { FinalScene } from './components/FinalScene';
import {
  getOrInitSession,
  initGlobalTracking,
  trackBackClick,
  trackScreenChange,
} from './utils/tracking';

type SceneId =
  | 'envelope'
  | 'story'
  | 'about'
  | 'transition'
  | 'question'
  | 'planner'
  | 'final';

const SCENE_ORDER: SceneId[] = [
  'envelope',
  'story',
  'about',
  'transition',
  'question',
  'planner',
  'final',
];

function getInitialScene(): SceneId {
  if (typeof window === 'undefined') return 'envelope';
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') return 'story';
  const requested = params.get('scene') as SceneId | null;
  if (requested && SCENE_ORDER.includes(requested)) return requested;
  return 'envelope';
}

type IntroState = 'open' | 'exiting' | 'done';

function getInitialIntroState(): IntroState {
  if (typeof window === 'undefined') return 'open';
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1' || Boolean(params.get('scene'))) {
    return 'done';
  }
  return 'open';
}

export default function App() {
  const prefersReduced = useReducedMotion();
  const [introState, setIntroState] = useState<IntroState>(getInitialIntroState);
  const [scene, setScene] = useState<SceneId>(getInitialScene);
  const [completedSelection, setCompletedSelection] = useState<CompletedDateSelection | null>(
    null
  );

  const [audioAvailable, setAudioAvailable] = useState(true);
  const [publishedUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return '';
    return window.location.origin;
  });

  // Модальное окно QR-генератора для карточки к букету
  const [isQrOpen, setIsQrOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('qr') === '1';
  });

  // Постоянный аудиоплеер на корневом уровне — музыка не сбрасывается при смене сцен
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const introTimerRef = useRef<number | null>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);

  // Глобальный трекинг кликов, визитов, сворачивания и закрытия страницы
  useEffect(() => {
    const initialScreen = introState === 'open' ? 'intro' : scene === 'planner' ? 'planner:meeting' : scene;
    const cleanup = initGlobalTracking(initialScreen);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Фиксируем переходы между экранами (после выхода с интро)
  useEffect(() => {
    if (introState === 'open') return;
    const targetScreen = scene === 'planner' ? 'planner:meeting' : scene;
    trackScreenChange(targetScreen);
  }, [introState, scene]);

  // Блокируем прокрутку страницы, пока открыт интро-экран
  useEffect(() => {
    if (introState === 'done') return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [introState]);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  // Плавный fade-in громкости от 0 до целевого уровня за ~3.5 секунды
  const startAudioWithFade = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioAvailable) return;

    clearFadeTimer();
    userPausedRef.current = false;

    const beginVolumeRamp = () => {
      clearFadeTimer();
      const totalSteps = 50; // 50 * 70мс = 3500мс (3.5 сек)
      let step = 0;

      fadeTimerRef.current = window.setInterval(() => {
        step += 1;
        const progress = Math.min(1, step / totalSteps);
        if (audioRef.current) {
          audioRef.current.volume = volumeRef.current * progress;
        }
        if (progress >= 1) {
          clearFadeTimer();
        }
      }, 70);
    };

    try {
      audio.muted = isMutedRef.current;
      audio.volume = 0;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsPlaying(true);
            beginVolumeRamp();
          })
          .catch(() => {
            clearFadeTimer();
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
        beginVolumeRamp();
      }
    } catch {
      clearFadeTimer();
      setIsPlaying(false);
    }
  }, [audioAvailable, clearFadeTimer]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioAvailable) return;

    if (isPlaying) {
      clearFadeTimer();
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      startAudioWithFade();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    clearFadeTimer();
    setVolume(nextVol);
    volumeRef.current = nextVol;
    const muted = nextVol === 0;
    setIsMuted(muted);
    isMutedRef.current = muted;
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = nextVol;
    }
  };

  useEffect(() => {
    return () => {
      clearFadeTimer();
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
      }
    };
  }, [clearFadeTimer]);

  const goToScene = (next: SceneId) => {
    setScene(next);
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  const handleStartFromIntro = () => {
    if (introState !== 'open') return;
    setIntroState('exiting');
    startAudioWithFade();

    const exitDurationMs = prefersReduced ? 350 : 1500;
    introTimerRef.current = window.setTimeout(() => {
      setIntroState('done');
      introTimerRef.current = null;
    }, exitDurationMs);
  };

  const handleStartOpenAudio = () => {
    if (audioAvailable && !isPlaying && !userPausedRef.current) {
      startAudioWithFade();
    }
  };

  const handleOpenLetter = () => {
    goToScene('story');
  };

  const currentIdx = SCENE_ORDER.indexOf(scene);
  const canGoBack = currentIdx > 0 && scene !== 'final';

  const handleBack = () => {
    if (currentIdx > 0) {
      const prevScene = SCENE_ORDER[currentIdx - 1];
      const fromScreen = getOrInitSession().currentScreen || (scene === 'planner' ? 'planner:meeting' : scene);
      const toScreen = prevScene === 'planner' ? 'planner:meeting' : prevScene;
      trackBackClick(fromScreen, toScreen, 'Назад (шапка)');
      goToScene(prevScene);
    }
  };

  const isIntroVisible = introState !== 'done';

  return (
    <div className="relative min-h-[100dvh] bg-[#FFF9F4] text-[#4A3835] paper-grain flex flex-col">
      {/* Постоянный аудио-элемент: смонтирован сразу для надежного старта на iOS Safari по клику */}
      {audioAvailable && (
        <audio
          ref={audioRef}
          src={INVITATION_CONFIG.music.src}
          loop
          playsInline
          preload="metadata"
          onEnded={() => setIsPlaying(false)}
          onError={() => setAudioAvailable(false)}
        />
      )}

      {/* Интро-экран поверх основного сайта */}
      <AnimatePresence>
        {isIntroVisible && (
          <IntroOverlay
            key="intro-overlay"
            isExiting={introState === 'exiting'}
            onStart={handleStartFromIntro}
          />
        )}
      </AnimatePresence>

      {/* Основной сайт: скрыт и не кликабелен до нажатия, затем мягко проявляется */}
      <motion.div
        aria-hidden={isIntroVisible}
        initial={false}
        animate={
          introState === 'open'
            ? { opacity: 0, y: prefersReduced ? 0 : 10 }
            : { opacity: 1, y: 0 }
        }
        transition={{
          duration: prefersReduced ? 0.25 : 1.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`flex-1 flex flex-col ${
          introState === 'open' ? 'pointer-events-none select-none' : ''
        }`}
      >

      {/* Легкие плавающие лепестки или сердечки */}
      <FloatingPetals
        variant={scene === 'question' || scene === 'final' ? 'hearts' : 'petals'}
        count={scene === 'question' || scene === 'final' ? 7 : 5}
      />

      {/* Компактная верхняя панель (≤ 10% мобильной высоты) */}
      <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-[#FFF9F4]/88 backdrop-blur-md border-b border-[#D8BD91]/25">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {canGoBack ? (
              <button
                type="button"
                onClick={handleBack}
                data-track="Назад (шапка)"
                data-track-role="back"
                aria-label="Вернуться к предыдущему экрану"
                className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-full hover:bg-[#F8EEE8] text-[#725A55] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <span className="w-2" aria-hidden="true" />
            )}

            <span
              className="hidden sm:inline-block text-xs text-[#725A55]/70 tabular-nums whitespace-nowrap ml-2"
              aria-label={`Шаг ${currentIdx + 1} из ${SCENE_ORDER.length}`}
            >
              0{currentIdx + 1} / 0{SCENE_ORDER.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <MusicPlayer
              audioAvailable={audioAvailable}
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              onTogglePlay={handleTogglePlay}
              onToggleMute={handleToggleMute}
              onVolumeChange={handleVolumeChange}
            />
          </div>
        </div>
      </header>

      {/* Основной контейнер сцен */}
      <main className="relative z-10 flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {scene === 'envelope' && (
              <EnvelopeScene
                onStartOpen={handleStartOpenAudio}
                onOpenLetter={handleOpenLetter}
              />
            )}

            {scene === 'story' && (
              <StoryScene onNext={() => goToScene('about')} />
            )}

            {scene === 'about' && (
              <AboutBekScene onNext={() => goToScene('transition')} />
            )}

            {scene === 'transition' && (
              <RomanticTransition onNext={() => goToScene('question')} />
            )}

            {scene === 'question' && (
              <InvitationScene
                onAcceptContinue={() => goToScene('planner')}
                onReturnToStory={() => goToScene('envelope')}
              />
            )}

            {scene === 'planner' && (
              <DatePickerScene
                onSuccess={(selection) => {
                  setCompletedSelection(selection);
                  goToScene('final');
                }}
              />
            )}

            {scene === 'final' && completedSelection && (
              <FinalScene
                selection={completedSelection}
                onReplay={() => goToScene('envelope')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <QRGenerator
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        publishedUrl={publishedUrl}
      />
      </motion.div>
    </div>
  );
}
