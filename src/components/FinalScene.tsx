import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Calendar, MapPin, Phone, RotateCcw, Info } from 'lucide-react';
import { KittenPairSvg } from './KittenPairSvg';
import { INVITATION_CONFIG } from '../config/invitationConfig';
import type { CompletedDateSelection } from './DatePickerScene';

interface FinalSceneProps {
  selection: CompletedDateSelection;
  onReplay: () => void;
}

export function FinalScene({ selection, onReplay }: FinalSceneProps) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    try {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#F4D9DA', '#D9A0A6', '#98636F', '#D8BD91', '#FFF9F4'],
      });
    } catch {
      // Игнорируем в headless среде без canvas
    }
  }, [prefersReduced]);

  return (
    <section
      aria-label="Приглашение подтверждено"
      className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 text-center"
    >
      {/* Индикатор из 3 шагов: 1. Встреча → 2. Контакты → 3. Итог */}
      <nav
        aria-label="Шаги ответа"
        className="mb-6 grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:justify-center sm:gap-3 text-xs font-medium max-w-md mx-auto"
      >
        {[
          { label: '1. Встреча', active: false },
          { label: '2. Контакты', active: false },
          { label: '3. Итог', active: true },
        ].map((item) => (
          <span
            key={item.label}
            className={`min-h-[40px] px-2 sm:px-4 py-1.5 rounded-full flex items-center justify-center whitespace-nowrap truncate ${
              item.active
                ? 'bg-[#98636F] text-[#FFF9F4]'
                : 'bg-[#F8EEE8] text-[#725A55]'
            }`}
          >
            {item.label}
          </span>
        ))}
      </nav>

      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl bg-[#FFF9F4]/95 border border-[#D8BD91]/55 shadow-[0_22px_54px_rgba(114,90,85,0.1)] p-6 sm:p-10"
      >
        <div className="w-full max-w-[300px] sm:max-w-[320px] mx-auto">
          <KittenPairSvg mood="celebrating" />
        </div>

        <h1 className="mt-4 font-serif text-3xl sm:text-5xl font-medium text-[#4A3835] leading-tight text-balance">
          {INVITATION_CONFIG.final.headline}
        </h1>

        <p className="mt-3 text-lg sm:text-xl text-[#725A55] leading-relaxed">
          {INVITATION_CONFIG.final.subheadline}
        </p>

        <p className="mt-4 font-script text-3xl text-[#98636F]">
          {INVITATION_CONFIG.final.signature}
        </p>

        {/* Итоговая карточка встречи */}
        <div className="mt-7 rounded-2xl bg-[#F8EEE8]/85 border border-[#D8BD91]/50 p-5 sm:p-6 text-left max-w-md mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-[#98636F] text-center mb-4">
            Детали встречи
          </p>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#98636F] shrink-0" />
              <div>
                <dt className="sr-only">Дата и время</dt>
                <dd className="font-medium text-[#4A3835] tabular-nums">
                  {selection.formattedDate}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#98636F] shrink-0" />
              <div>
                <dt className="sr-only">Телефон</dt>
                <dd className="font-medium text-[#4A3835] tabular-nums">
                  {selection.phone}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#98636F] shrink-0 mt-0.5" />
              <div>
                <dt className="sr-only">Адрес</dt>
                <dd className="font-medium text-[#4A3835] break-words">
                  {selection.address}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Честное уведомление о состоянии доставки в Telegram */}
        {selection.mode === 'demo' && (
          <div className="mt-5 max-w-md mx-auto rounded-xl bg-[#F8EEE8]/60 border border-[#D8BD91]/40 px-4 py-3 text-left flex items-start gap-2.5 text-xs text-[#725A55]">
            <Info className="w-4 h-4 text-[#98636F] shrink-0 mt-0.5" />
            <span>
              Демонстрационный режим: ответ сохранен на сервере. Для отправки уведомления Бакытжану в Telegram добавьте переменные{' '}
              <code className="text-[#98636F]">TELEGRAM_BOT_TOKEN</code> и{' '}
              <code className="text-[#98636F]">TELEGRAM_CHAT_ID</code> в настройки сервера.
            </span>
          </div>
        )}

        {selection.mode === 'saved' && (
          <div className="mt-5 max-w-md mx-auto rounded-xl bg-[#F8EEE8]/60 border border-[#D8BD91]/40 px-4 py-3 text-left flex items-start gap-2.5 text-xs text-[#725A55]">
            <Info className="w-4 h-4 text-[#98636F] shrink-0 mt-0.5" />
            <span>
              Ответ надежно сохранен на сервере. Уведомление в Telegram пока не отправлено:{' '}
              {selection.telegramWarning ||
                'проверьте числовой TELEGRAM_CHAT_ID и нажмите /start в диалоге с ботом.'}
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            data-track="Перечитать письмо"
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#F8EEE8] hover:bg-[#F4D9DA]/55 border border-[#D8BD91]/55 text-xs sm:text-sm font-medium text-[#4A3835] inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Перечитать письмо</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
