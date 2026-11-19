import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Headphones } from 'lucide-react';

interface IntroOverlayProps {
  isExiting: boolean;
  onStart: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function IntroOverlay({ isExiting, onStart }: IntroOverlayProps) {
  const prefersReduced = useReducedMotion();

  // Деликатные светящиеся частицы для темного фона (легкие для мобильных GPU)
  const motes = useMemo(
    () => [
      { id: 0, left: '14%', top: '76%', size: 4, duration: 9, delay: 0, driftX: 12 },
      { id: 1, left: '28%', top: '82%', size: 5, duration: 11, delay: 1.1, driftX: -10 },
      { id: 2, left: '46%', top: '72%', size: 3.5, duration: 8.5, delay: 0.5, driftX: 8 },
      { id: 3, left: '64%', top: '80%', size: 4.5, duration: 10.5, delay: 1.8, driftX: -14 },
      { id: 4, left: '80%', top: '74%', size: 4, duration: 9.5, delay: 0.8, driftX: 10 },
      { id: 5, left: '22%', top: '34%', size: 3, duration: 12, delay: 2.1, driftX: 9 },
      { id: 6, left: '72%', top: '28%', size: 3.5, duration: 10, delay: 1.4, driftX: -9 },
      { id: 7, left: '52%', top: '44%', size: 3, duration: 11.5, delay: 2.6, driftX: 7 },
    ],
    []
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Вступительный экран"
      initial={{ opacity: 1 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.01 } }}
      transition={{ duration: prefersReduced ? 0.35 : 1.5, ease: EASE_OUT }}
      className={`fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center text-center select-none bg-[#150E11] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] ${
        isExiting ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Мягкое теплое свечение в цветах сайта (#98636F / #D8BD91) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(152, 99, 111, 0.22) 0%, rgba(114, 90, 85, 0.08) 42%, rgba(21, 14, 17, 0.96) 80%)',
        }}
      />

      {/* Плавные светящиеся частицы */}
      {!prefersReduced && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {motes.map((m) => (
            <motion.span
              key={m.id}
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                willChange: 'transform, opacity',
              }}
              className="absolute rounded-full bg-[#F4D9DA]/70 shadow-[0_0_10px_rgba(216,189,145,0.45)]"
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{
                opacity: [0, 0.55, 0.25, 0],
                y: [-10, -140],
                x: [0, m.driftX],
              }}
              transition={{
                duration: m.duration,
                delay: m.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Центральная композиция */}
      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        {/* Пульсирующая иконка наушников */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0.25 : 1.2, ease: EASE_OUT }}
          className="mb-5"
        >
          <motion.div
            animate={
              prefersReduced
                ? undefined
                : { scale: [1, 1.09, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={
              prefersReduced
                ? undefined
                : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
            }
            className="w-14 h-14 rounded-full bg-[#98636F]/20 border border-[#D8BD91]/35 flex items-center justify-center text-[#F4D9DA] shadow-[0_0_28px_rgba(217,160,166,0.18)]"
          >
            <Headphones className="w-6 h-6" strokeWidth={1.7} />
          </motion.div>
        </motion.div>

        {/* Основная надпись */}
        <motion.h1
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0.25 : 1.2, ease: EASE_OUT }}
          className="font-serif text-3xl sm:text-4xl font-medium text-[#FFF9F4] tracking-wide leading-snug text-balance"
        >
          🎧 Увеличь громкость
        </motion.h1>

        {/* Вторая строка с задержкой ~1.5 сек */}
        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0.25 : 1.2,
            delay: prefersReduced ? 0 : 1.5,
            ease: EASE_OUT,
          }}
          className="mt-3 font-serif italic text-xl sm:text-2xl text-[#D8BD91]/90"
        >
          Так будет красивее ✨
        </motion.p>

        {/* Кнопка старта еще через 1 сек (итого ~2.5 сек) с мягким дыханием */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0.25 : 1.0,
            delay: prefersReduced ? 0 : 2.5,
            ease: EASE_OUT,
          }}
          className="relative mt-9 inline-flex items-center justify-center"
        >
          {!prefersReduced && !isExiting && (
            <motion.span
              aria-hidden="true"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.42, 0.14, 0.42],
              }}
              transition={{ duration: 3.0, delay: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 rounded-full bg-[#D9A0A6]/35 blur-md"
            />
          )}

          <motion.button
            type="button"
            disabled={isExiting}
            onClick={onStart}
            data-track="Нажми, чтобы начать"
            animate={
              prefersReduced || isExiting
                ? undefined
                : {
                    boxShadow: [
                      '0 10px 28px rgba(152, 99, 111, 0.28)',
                      '0 14px 40px rgba(217, 160, 166, 0.5)',
                      '0 10px 28px rgba(152, 99, 111, 0.28)',
                    ],
                  }
            }
            transition={
              prefersReduced || isExiting
                ? undefined
                : { duration: 3.0, delay: 3.2, repeat: Infinity, ease: 'easeInOut' }
            }
            whileTap={prefersReduced ? undefined : { scale: 0.97 }}
            className="relative min-h-[52px] px-8 py-3.5 rounded-full bg-[#98636F] hover:bg-[#A66F7B] border border-[#D8BD91]/40 text-[#FFF9F4] text-base font-medium transition-colors cursor-pointer whitespace-nowrap touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8BD91]"
          >
            Нажми, чтобы начать
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
