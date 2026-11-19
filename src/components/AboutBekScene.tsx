import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { INVITATION_CONFIG } from '../config/invitationConfig';

interface AboutBekSceneProps {
  onNext: () => void;
}

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AboutBekScene({ onNext }: AboutBekSceneProps) {
  const prefersReduced = useReducedMotion();
  const clipId = useId();

  return (
    <section
      aria-label="Немного о Бакытжане"
      className="relative max-w-xl mx-auto min-h-[calc(100dvh-76px)] flex flex-col items-center justify-center px-6 sm:px-8 py-8 sm:py-12 text-center"
    >
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.65, ease: SMOOTH_EASE }}
        className="w-full flex flex-col items-center"
      >
        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, delay: 0.05, ease: SMOOTH_EASE }}
          className="text-[11px] uppercase tracking-[0.26em] text-[#98636F]/85 font-medium"
        >
          {INVITATION_CONFIG.aboutBek.chapter}
        </motion.p>

        <motion.h1
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.12, ease: SMOOTH_EASE }}
          className="mt-2.5 font-serif text-[32px] sm:text-[42px] font-medium text-[#4A3835] leading-[1.16] text-balance"
        >
          {INVITATION_CONFIG.aboutBek.headline}
        </motion.h1>

        {/* Легкий декоративный акцент: плавно прорисовывающаяся пунктирная линия и мерцающая звездочка */}
        <div className="my-5 flex items-center justify-center" aria-hidden="true">
          <svg
            width="196"
            height="28"
            viewBox="0 0 196 28"
            fill="none"
            className="overflow-visible"
          >
            <defs>
              <clipPath id={clipId}>
                <motion.rect
                  x="0"
                  y="0"
                  height="28"
                  initial={prefersReduced ? { width: 174 } : { width: 0 }}
                  whileInView={{ width: 174 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 1.25, delay: 0.2, ease: SMOOTH_EASE }}
                />
              </clipPath>
            </defs>

            <path
              d="M 8 15 Q 50 7, 90 14 T 170 14"
              stroke="#D8BD91"
              strokeWidth="1.5"
              strokeDasharray="3.5 5"
              strokeLinecap="round"
              clipPath={`url(#${clipId})`}
            />

            <g transform="translate(184, 14)">
              <motion.path
                d="M 0 -7.5 Q 0.8 -0.8 7.5 0 Q 0.8 0.8 0 7.5 Q -0.8 0.8 -7.5 0 Q -0.8 -0.8 0 -7.5 Z"
                fill="#C48892"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={{ opacity: 0.75, scale: 0.95 }}
                animate={
                  prefersReduced
                    ? { opacity: 0.95, scale: 1 }
                    : { opacity: [0.42, 1, 0.42], scale: [0.85, 1.12, 0.85] }
                }
                transition={
                  prefersReduced
                    ? { duration: 0.2 }
                    : { duration: 3.2, delay: 0.25, repeat: Infinity, ease: 'easeInOut' }
                }
              />
            </g>
          </svg>
        </div>

        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.22, ease: SMOOTH_EASE }}
          className="font-serif italic text-2xl sm:text-[28px] font-medium text-[#98636F] tracking-wide"
        >
          {INVITATION_CONFIG.heroName}
        </motion.p>

        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.32, ease: SMOOTH_EASE }}
          className="mt-4 max-w-[36ch] mx-auto text-[15px] sm:text-base text-[#4A3835]/88 leading-[1.78]"
        >
          {INVITATION_CONFIG.aboutBek.bio}
        </motion.p>

        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.42, ease: SMOOTH_EASE }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={onNext}
            data-track="Кажется, самое интересное впереди"
            className="min-h-[48px] px-7 py-3 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-sm sm:text-base font-medium shadow-[0_10px_24px_rgba(152,99,111,0.22)] transition-colors cursor-pointer whitespace-nowrap touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
          >
            {INVITATION_CONFIG.aboutBek.ctaLabel}
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
