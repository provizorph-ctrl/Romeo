import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { KittenPairSvg } from './KittenPairSvg';
import { INVITATION_CONFIG } from '../config/invitationConfig';
import { computeDodgeOffset, type Offset2D } from '../utils/dodgePhysics';
import {
  trackBackClick,
  trackConsentClick,
  trackNoAttempt,
} from '../utils/tracking';

interface InvitationSceneProps {
  onAcceptContinue: () => void;
  onReturnToStory: () => void;
}

export function InvitationScene({
  onAcceptContinue,
  onReturnToStory,
}: InvitationSceneProps) {
  const prefersReduced = useReducedMotion();
  const [status, setStatus] = useState<'asking' | 'accepted' | 'declined'>('asking');
  const [noOffset, setNoOffset] = useState<Offset2D>({ x: 0, y: 0 });
  const [dodgeAttempts, setDodgeAttempts] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const triggerDodge = (trigger: 'click' | 'hover') => {
    if (status !== 'asking') return;
    trackNoAttempt(trigger, 'Нет', 'question');
    const stageWidth = stageRef.current?.clientWidth ?? 320;
    const isNarrow = stageWidth < 480;
    const maxX = Math.max(44, Math.min(115, Math.floor(stageWidth * 0.25)));
    const maxY = isNarrow ? 12 : 38;

    const nextAttempt = dodgeAttempts + 1;
    const nextOffset = computeDodgeOffset({
      currentOffset: noOffset,
      bounds: { maxX, maxY },
      attempt: nextAttempt,
      seed: 3,
    });
    setDodgeAttempts(nextAttempt);
    setNoOffset(nextOffset);
  };

  const handleAccept = () => {
    trackConsentClick('Да! ❤️', 'question');
    setStatus('accepted');
    if (!prefersReduced) {
      try {
        confetti({
          particleCount: 70,
          spread: 72,
          origin: { y: 0.62 },
          colors: ['#F4D9DA', '#D9A0A6', '#98636F', '#D8BD91', '#FFF9F4'],
        });
      } catch {
        // Игнорируем возможные ограничения canvas в headless среде
      }
    }
  };

  if (status === 'declined') {
    return (
      <section
        aria-label="Уважительный ответ"
        className="min-h-[calc(100dvh-76px)] flex flex-col items-center justify-center px-5 py-10 text-center"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto rounded-3xl bg-[#FFF9F4]/95 border border-[#D8BD91]/50 shadow-[0_18px_46px_rgba(114,90,85,0.08)] p-8 sm:p-10"
        >
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#4A3835]">
            {INVITATION_CONFIG.invitation.declinedHeadline}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#725A55] leading-relaxed">
            {INVITATION_CONFIG.invitation.declinedText}
          </p>
          <button
            type="button"
            data-track="Вернуться к письму"
            data-track-role="back"
            onClick={() => {
              trackBackClick('question', 'envelope', 'Вернуться к письму');
              onReturnToStory();
            }}
            className="mt-8 min-h-[46px] px-6 py-2.5 rounded-full bg-[#F8EEE8] hover:bg-[#F4D9DA]/50 border border-[#D8BD91]/60 text-sm font-medium text-[#4A3835] transition-colors cursor-pointer"
          >
            {INVITATION_CONFIG.invitation.declinedBackLabel}
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section
      aria-label="Главное приглашение на свидание"
      className="relative min-h-[calc(100dvh-76px)] flex flex-col items-center justify-center px-5 py-8 text-center"
    >
      {/* Мягкое светящееся теплое пятно */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full bg-[#F4D9DA]/45 blur-3xl -z-0"
      />

      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center"
      >
        <div className="w-full max-w-[330px] sm:max-w-[380px]">
          <KittenPairSvg
            mood={
              status === 'accepted'
                ? 'celebrating'
                : dodgeAttempts > 0
                  ? 'shy'
                  : 'hopeful'
            }
          />
        </div>

        {status === 'accepted' ? (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mt-4 max-w-xl"
          >
            <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#4A3835] leading-tight text-balance">
              {INVITATION_CONFIG.invitation.acceptedHeadline}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#725A55]">
              {INVITATION_CONFIG.invitation.acceptedSubtext}
            </p>
            <button
              type="button"
              onClick={onAcceptContinue}
              data-track="Продолжить (после согласия)"
              className="mt-8 min-h-[50px] px-8 py-3.5 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-base font-medium shadow-[0_12px_28px_rgba(152,99,111,0.28)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
            >
              Продолжить →
            </button>
          </motion.div>
        ) : (
          <>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-[#4A3835] leading-[1.12] text-balance">
              {INVITATION_CONFIG.invitation.question}
            </h1>

            <p className="mt-3.5 text-base sm:text-lg text-[#725A55] max-w-md leading-relaxed">
              {INVITATION_CONFIG.invitation.subtitle}
            </p>

            {/* Ограниченная сцена для кнопок «Да» и уворачивающейся «Нет» */}
            <div
              ref={stageRef}
              className="relative mt-8 w-full max-w-md min-h-[124px] flex flex-col sm:flex-row items-center justify-center gap-4 px-4 py-4"
            >
              <motion.button
                type="button"
                onClick={handleAccept}
                data-track="Да! ❤️"
                data-track-role="agree"
                whileHover={prefersReduced ? undefined : { scale: 1.04 }}
                whileTap={prefersReduced ? undefined : { scale: 0.97 }}
                className="relative z-20 w-full sm:w-auto min-h-[52px] min-w-[164px] max-w-[260px] px-8 py-3.5 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-base sm:text-lg font-medium shadow-[0_14px_30px_rgba(152,99,111,0.3)] transition-colors cursor-pointer whitespace-nowrap touch-manipulation select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
              >
                {INVITATION_CONFIG.invitation.yesLabel}
              </motion.button>

              <motion.button
                type="button"
                data-track="Нет 🙈"
                data-track-role="no"
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') {
                    triggerDodge('hover');
                  }
                }}
                onClick={() => triggerDodge('click')}
                animate={prefersReduced ? undefined : { x: noOffset.x, y: noOffset.y }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="relative z-10 min-h-[48px] min-w-[136px] px-7 py-3 rounded-full bg-[#FFF9F4] hover:bg-[#F8EEE8] border border-[#D8BD91]/70 text-[#725A55] text-base font-medium shadow-sm cursor-pointer whitespace-nowrap touch-manipulation select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
              >
                {INVITATION_CONFIG.invitation.noLabel}
              </motion.button>
            </div>

            {dodgeAttempts > 0 && (
              <p className="mt-1 text-xs text-[#98636F] transition-opacity">
                Кажется, эта кнопка немного стесняется 🙈
              </p>
            )}
          </>
        )}
      </motion.div>
    </section>
  );
}
