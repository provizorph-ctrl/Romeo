import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { INVITATION_CONFIG } from '../config/invitationConfig';

interface StorySceneProps {
  onNext: () => void;
}

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function StoryScene({ onNext }: StorySceneProps) {
  const prefersReduced = useReducedMotion();
  const paragraphs = INVITATION_CONFIG.story.paragraphs;
  const [imgFailed, setImgFailed] = useState(false);

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: prefersReduced ? 0 : 0.12,
        staggerChildren: prefersReduced ? 0 : 0.11,
      },
    },
  };

  const itemVariants = {
    hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReduced ? 0.01 : 0.62,
        ease: SMOOTH_EASE,
      },
    },
  };

  return (
    <section
      aria-label="История нашего знакомства"
      className="relative max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Левая колонка: письмо с плавным каскадным раскрытием текста */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: SMOOTH_EASE }}
          className="lg:col-span-7 rounded-3xl bg-[#FFF9F4]/95 border border-[#D8BD91]/45 shadow-[0_18px_48px_rgba(114,90,85,0.08)] p-6 sm:p-10"
        >
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={itemVariants}
              className="text-xs uppercase tracking-[0.2em] text-[#98636F] mb-3"
            >
              {INVITATION_CONFIG.story.chapter}
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-[#4A3835] leading-tight text-balance"
            >
              {INVITATION_CONFIG.story.headline}
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="w-16 h-[1px] bg-[#D8BD91]/70 my-5 origin-left"
            />

            <div className="space-y-3.5 text-[15px] sm:text-base text-[#4A3835]/90 leading-[1.72] max-w-[65ch]">
              {paragraphs.map((text, idx) => (
                <motion.p
                  key={idx}
                  variants={itemVariants}
                  className={
                    idx === 0
                      ? 'font-serif italic text-xl text-[#98636F]'
                      : undefined
                  }
                >
                  {text}
                </motion.p>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-8">
              <button
                type="button"
                onClick={onNext}
                data-track="А теперь немного обо мне"
                className="min-h-[48px] px-7 py-3 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-sm sm:text-base font-medium shadow-[0_10px_24px_rgba(152,99,111,0.22)] inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
              >
                <span>{INVITATION_CONFIG.story.ctaLabel}</span>
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Правая колонка: художественная иллюстрация танцующей пары */}
        <motion.figure
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.18, ease: SMOOTH_EASE }}
          className="lg:col-span-5 flex flex-col items-center"
        >
          <motion.div
            animate={prefersReduced ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full max-w-[420px] rounded-3xl bg-[#F8EEE8] border border-[#D8BD91]/55 p-3 shadow-[0_18px_44px_rgba(114,90,85,0.1)]"
          >
            <div className="rounded-2xl overflow-hidden bg-[#FFF9F4] aspect-square flex items-center justify-center">
              {!imgFailed ? (
                <img
                  src={INVITATION_CONFIG.story.illustration}
                  alt="Акварельная иллюстрация пары под теплыми огоньками"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover object-[50%_45%]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FFF9F4] to-[#F4D9DA]/40">
                  <ArrowRight className="w-6 h-6 text-[#98636F]/60 mb-2" />
                  <p className="font-serif italic text-lg text-[#725A55]">
                    {INVITATION_CONFIG.story.illustrationCaption}
                  </p>
                </div>
              )}
            </div>
            <figcaption className="mt-3 mb-1 text-center font-serif italic text-sm text-[#725A55]">
              {INVITATION_CONFIG.story.illustrationCaption}
            </figcaption>
          </motion.div>
        </motion.figure>
      </div>
    </section>
  );
}
