import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { KittenPairSvg } from './KittenPairSvg';
import { INVITATION_CONFIG } from '../config/invitationConfig';

interface RomanticTransitionProps {
  onNext: () => void;
}

export function RomanticTransition({ onNext }: RomanticTransitionProps) {
  const prefersReduced = useReducedMotion();
  const [showPauseLine, setShowPauseLine] = useState(Boolean(prefersReduced));

  useEffect(() => {
    if (prefersReduced) {
      setShowPauseLine(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowPauseLine(true);
    }, 1150);
    return () => window.clearTimeout(timer);
  }, [prefersReduced]);

  return (
    <section
      aria-label="Небольшой момент перед главным вопросом"
      className="min-h-[calc(100dvh-76px)] flex flex-col items-center justify-center px-5 py-10 text-center"
    >
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-auto flex flex-col items-center"
      >
        <div className="w-full max-w-[320px] sm:max-w-[360px] mb-4">
          <KittenPairSvg mood="gentle" />
        </div>

        <p className="font-serif italic text-2xl sm:text-3xl text-[#98636F]">
          {INVITATION_CONFIG.transition.firstPart}
        </p>

        <h1 className="mt-3 font-serif text-2xl sm:text-4xl font-medium text-[#4A3835] leading-snug text-balance max-w-xl">
          {INVITATION_CONFIG.transition.secondPart}
        </h1>

        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={showPauseLine ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 font-script text-2xl sm:text-3xl text-[#725A55]"
        >
          {INVITATION_CONFIG.transition.pauseLine}
        </motion.p>

        <motion.button
          type="button"
          onClick={onNext}
          data-track="Узнать вопрос"
          whileTap={prefersReduced ? undefined : { scale: 0.97 }}
          className="mt-8 min-h-[48px] px-8 py-3 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-base font-medium shadow-[0_12px_28px_rgba(152,99,111,0.25)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
        >
          {INVITATION_CONFIG.transition.ctaLabel}
        </motion.button>
      </motion.div>
    </section>
  );
}
