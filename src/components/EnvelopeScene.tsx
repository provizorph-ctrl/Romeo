import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { INVITATION_CONFIG } from '../config/invitationConfig';

interface EnvelopeSceneProps {
  onStartOpen?: () => void;
  onOpenLetter: () => void;
}

export function EnvelopeScene({ onStartOpen, onOpenLetter }: EnvelopeSceneProps) {
  const [isOpening, setIsOpening] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Вызываем запуск аудио синхронно внутри жеста пользователя (критично для iOS Safari)
    onStartOpen?.();
    const delay = prefersReduced ? 100 : 580;
    window.setTimeout(() => {
      onOpenLetter();
    }, delay);
  };

  return (
    <section
      aria-label="Письмо от Бакытжана"
      className="relative min-h-[calc(100dvh-76px)] flex flex-col items-center justify-center px-4 sm:px-5 py-6 sm:py-10 text-center"
    >
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl mx-auto flex flex-col items-center"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-[#725A55]/85 mb-4">
          {INVITATION_CONFIG.envelope.eyebrow}
        </p>

        {/* Анимированный романтический конверт с сургучной печатью */}
        <motion.div
          animate={
            isOpening
              ? { scale: 1.04, y: -8 }
              : prefersReduced
                ? undefined
                : { y: [0, -6, 0] }
          }
          transition={
            isOpening
              ? { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
              : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
          }
          className="relative w-full max-w-[285px] sm:max-w-[380px] aspect-[4/3] my-3 sm:my-4 cursor-pointer touch-manipulation select-none"
          role="button"
          tabIndex={0}
          aria-label="Открыть конверт с письмом"
          data-track="Конверт (открыть письмо)"
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpen();
            }
          }}
        >
          {/* Подложка-тень конверта */}
          <div className="absolute inset-x-6 -bottom-4 h-8 rounded-full bg-[#725A55]/12 blur-lg" />

          {/* Корпус конверта */}
          <div className="relative w-full h-full rounded-2xl bg-[#F8EEE8] border border-[#D8BD91]/70 shadow-[0_20px_50px_rgba(114,90,85,0.12)] overflow-hidden">
            {/* Выступающее письмо внутри при открытии */}
            <motion.div
              initial={{ y: 28, opacity: 0.85 }}
              animate={isOpening ? { y: -48, opacity: 1 } : { y: 24, opacity: 0.9 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-5 top-5 bottom-4 rounded-xl bg-[#FFF9F4] border border-[#D8BD91]/40 shadow-sm flex flex-col items-center justify-start pt-5 px-4"
            >
              <div className="w-12 h-[1px] bg-[#D9A0A6]/60 mb-2" />
              <p className="font-script text-2xl text-[#98636F]">
                {INVITATION_CONFIG.recipientLabel}
              </p>
              <p className="mt-1 text-[11px] text-[#725A55]/75">
                от Бакытжана
              </p>
            </motion.div>

            {/* Боковые и нижняя грани конверта */}
            <svg
              viewBox="0 0 380 285"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              {/* Левый треугольник */}
              <polygon
                points="0,0 190,152 0,285"
                fill="#F3E5DC"
                stroke="#D8BD91"
                strokeOpacity="0.45"
                strokeWidth="1"
              />
              {/* Правый треугольник */}
              <polygon
                points="380,0 190,152 380,285"
                fill="#F3E5DC"
                stroke="#D8BD91"
                strokeOpacity="0.45"
                strokeWidth="1"
              />
              {/* Нижний клапан */}
              <polygon
                points="0,285 190,136 380,285"
                fill="#F8EEE8"
                stroke="#D8BD91"
                strokeOpacity="0.65"
                strokeWidth="1.2"
              />
            </svg>

            {/* Верхний клапан конверта, который раскрывается */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={isOpening ? { rotateX: 168, opacity: 0.5 } : { rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
              className="absolute inset-x-0 top-0 h-[56%] pointer-events-none z-10"
            >
              <svg viewBox="0 0 380 160" className="w-full h-full" preserveAspectRatio="none">
                <polygon
                  points="0,0 380,0 190,156"
                  fill="#FFF2EA"
                  stroke="#D8BD91"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                />
              </svg>
            </motion.div>

            {/* Сургучная печать с сердечком */}
            <motion.div
              animate={isOpening ? { scale: 0.65, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B47A86] to-[#87525E] shadow-[0_6px_16px_rgba(135,82,94,0.35)] border-2 border-[#D8BD91]/70 flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 20.4s-6.8-4.3-8.6-8.3C2 8.9 4 5.5 7.4 5.5c1.9 0 3.6 1.1 4.6 2.7 1-1.6 2.7-2.7 4.6-2.7 3.4 0 5.4 3.4 4 6.6-1.8 4-8.6 8.3-8.6 8.3z"
                    fill="#FFF9F4"
                    fillOpacity="0.92"
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <h1 className="mt-6 font-serif text-3xl sm:text-5xl font-medium text-[#4A3835] leading-tight text-balance">
          {INVITATION_CONFIG.envelope.headline.replace('кое-что', 'кое\u2011что')}
        </h1>

        <p className="mt-3 text-base sm:text-lg text-[#725A55] max-w-md leading-relaxed">
          {INVITATION_CONFIG.envelope.subtitle}
        </p>

        <motion.button
          type="button"
          onClick={handleOpen}
          disabled={isOpening}
          data-track="Открыть письмо"
          whileTap={prefersReduced ? undefined : { scale: 0.97 }}
          className="mt-8 min-h-[50px] px-8 py-3.5 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-base font-medium shadow-[0_12px_28px_rgba(152,99,111,0.28)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
        >
          {isOpening ? 'Открываем письмо...' : INVITATION_CONFIG.envelope.buttonLabel}
        </motion.button>
      </motion.div>
    </section>
  );
}
