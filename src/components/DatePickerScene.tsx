import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, Clock, MapPin, Phone, AlertCircle, Loader2, Check } from 'lucide-react';
import { INVITATION_CONFIG } from '../config/invitationConfig';
import {
  FIXED_DATE_DISPLAY,
  FIXED_DATE_ISO,
  extractNationalPhoneDigits,
  formatPhoneMask,
  isValidPickupAddress,
  normalizeAndValidatePhone,
} from '../utils/rsvpValidation';
import { submitRsvp } from '../services/telegramService';
import {
  trackBackClick,
  trackConsentClick,
  trackFieldFocus,
  trackFormSubmitted,
  trackScreenChange,
} from '../utils/tracking';

export interface CompletedDateSelection {
  date: string;
  formattedDate: string;
  timeSlot: string;
  phone: string;
  address: string;
  mode: 'telegram' | 'demo' | 'saved';
  telegramSent: boolean;
  telegramWarning?: string;
}

interface DatePickerSceneProps {
  onSuccess: (selection: CompletedDateSelection) => void;
}

export function DatePickerScene({ onSuccess }: DatePickerSceneProps) {
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState<'meeting' | 'contacts'>('meeting');
  const [meetingConfirmed, setMeetingConfirmed] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [address, setAddress] = useState('');
  const [addressTouched, setAddressTouched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [submissionId] = useState(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  const phoneCheck = normalizeAndValidatePhone(phone);
  const addressValid = isValidPickupAddress(address);
  const isFormValid = phoneCheck.valid && addressValid;

  useEffect(() => {
    trackScreenChange(step === 'meeting' ? 'planner:meeting' : 'planner:contacts');
  }, [step]);

  const handlePhoneChange = (nextRaw: string) => {
    const digits = extractNationalPhoneDigits(nextRaw, phone);
    setPhone(formatPhoneMask(digits));
  };

  const handleConfirmMeeting = () => {
    trackConsentClick(INVITATION_CONFIG.datePlanner.acceptDateLabel, 'planner:meeting');
    setMeetingConfirmed(true);
    setStep('contacts');
  };

  const handleBackToMeeting = (label: string) => {
    trackBackClick('planner:contacts', 'planner:meeting', label);
    setStep('meeting');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setAddressTouched(true);

    if (!isFormValid || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitRsvp({
        accepted: true,
        date: FIXED_DATE_ISO,
        timeSlot: '19:00',
        phone: phoneCheck.formatted,
        address: address.trim(),
        submissionId,
      });

      setHasSubmitted(true);
      trackFormSubmitted('planner:contacts');

      onSuccess({
        date: FIXED_DATE_ISO,
        formattedDate: FIXED_DATE_DISPLAY,
        timeSlot: '19:00',
        phone: phoneCheck.formatted,
        address: address.trim(),
        mode: result.mode || (result.telegramSent ? 'telegram' : 'demo'),
        telegramSent: Boolean(result.telegramSent),
        telegramWarning: result.telegramWarning,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Не удалось отправить ответ. Проверьте интернет и попробуйте снова.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Подтверждение встречи и контакты"
      className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10"
    >
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#4A3835] leading-tight text-balance">
          {INVITATION_CONFIG.datePlanner.headline}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#725A55]">
          {INVITATION_CONFIG.datePlanner.subtitle}
        </p>

        {/* Индикатор из 3 шагов: 1. Встреча → 2. Контакты → 3. Итог */}
        <nav
          aria-label="Шаги ответа"
          className="mt-5 grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:justify-center sm:gap-3 text-xs font-medium max-w-md mx-auto"
        >
          {[
            { id: 'meeting', label: '1. Встреча', enabled: true },
            { id: 'contacts', label: '2. Контакты', enabled: meetingConfirmed },
            { id: 'final', label: '3. Итог', enabled: false },
          ].map((item) => {
            const isActive = step === item.id;
            const isBackToMeeting = item.id === 'meeting' && step === 'contacts';
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled || hasSubmitted}
                data-track={`Шаг: ${item.label}`}
                data-track-role={isBackToMeeting ? 'back' : undefined}
                onClick={() => {
                  if (item.id === 'meeting' && step === 'contacts') {
                    handleBackToMeeting('Шаг: 1. Встреча');
                  } else if (item.id === 'meeting' || item.id === 'contacts') {
                    setStep(item.id);
                  }
                }}
                className={`min-h-[40px] px-2 sm:px-4 py-1.5 rounded-full transition-colors whitespace-nowrap truncate ${
                  isActive
                    ? 'bg-[#98636F] text-[#FFF9F4]'
                    : item.enabled && !hasSubmitted
                      ? 'bg-[#F8EEE8] text-[#4A3835] hover:bg-[#F4D9DA]/60 cursor-pointer'
                      : 'text-[#725A55]/45 cursor-not-allowed'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ================= ШАГ 1: ВСТРЕЧА (фиксированные дата и время) ================= */}
      {step === 'meeting' && (
        <motion.div
          key="step-meeting"
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#FFF9F4] border border-[#D8BD91]/55 shadow-[0_18px_48px_rgba(114,90,85,0.08)] p-6 sm:p-10 max-w-lg mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F8EEE8] border border-[#D8BD91]/45 px-4 py-1.5 text-xs uppercase tracking-[0.16em] text-[#98636F] font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>{INVITATION_CONFIG.datePlanner.fixedCardLabel}</span>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#F8EEE8]/90 to-[#F4D9DA]/30 border border-[#D8BD91]/50 p-6 sm:p-8">
            <div className="flex items-center justify-center gap-3 text-[#98636F] mb-3">
              <Calendar className="w-5 h-5" />
              <span className="w-6 h-[1px] bg-[#D8BD91]" aria-hidden="true" />
              <Clock className="w-5 h-5" />
            </div>

            <p className="font-serif text-2xl sm:text-[28px] font-medium text-[#4A3835] leading-snug text-balance">
              {INVITATION_CONFIG.datePlanner.fixedCardText}
            </p>
          </div>

          <div className="mt-7">
            <motion.button
              type="button"
              onClick={handleConfirmMeeting}
              data-track="Хорошо, я согласна"
              data-track-role="agree"
              whileTap={prefersReduced ? undefined : { scale: 0.98 }}
              className="w-full min-h-[52px] px-7 py-3.5 rounded-full bg-[#98636F] hover:bg-[#82525D] text-[#FFF9F4] text-base font-medium shadow-[0_12px_28px_rgba(152,99,111,0.28)] transition-colors cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98636F]"
            >
              {INVITATION_CONFIG.datePlanner.acceptDateLabel}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ================= ШАГ 2: КОНТАКТЫ ================= */}
      {step === 'contacts' && (
        <motion.form
          key="step-contacts"
          onSubmit={handleSubmit}
          noValidate
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-[#FFF9F4] border border-[#D8BD91]/55 shadow-[0_18px_48px_rgba(114,90,85,0.08)] p-6 sm:p-9 max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-[#D8BD91]/35">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#4A3835]">
              <Check className="w-4 h-4 text-[#98636F] shrink-0" />
              <span>{INVITATION_CONFIG.datePlanner.fixedDateLabel}</span>
            </div>
            <button
              type="button"
              data-track="Назад (к встрече)"
              data-track-role="back"
              onClick={() => handleBackToMeeting('Назад (к встрече)')}
              className="text-xs text-[#725A55] hover:text-[#4A3835] underline underline-offset-4 cursor-pointer shrink-0"
            >
              Назад
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="contact-phone-input"
                className="flex items-center gap-2 text-sm font-medium text-[#4A3835] mb-2"
              >
                <Phone className="w-4 h-4 text-[#98636F]" />
                <span>{INVITATION_CONFIG.datePlanner.phoneLabel}</span>
                <span className="text-[#98636F]" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="contact-phone-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onFocus={() => trackFieldFocus('phone', 'Номер телефона', 'planner:contacts')}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                placeholder={INVITATION_CONFIG.datePlanner.phonePlaceholder}
                aria-invalid={phoneTouched && !phoneCheck.valid}
                className="w-full min-h-[48px] rounded-xl bg-[#F8EEE8]/65 border border-[#D8BD91]/60 px-4 py-2.5 text-base sm:text-sm text-[#4A3835] placeholder:text-[#725A55]/55 focus:outline-none focus:border-[#98636F] tabular-nums"
              />
              {phoneTouched && !phoneCheck.valid && (
                <p className="mt-1.5 text-xs text-[#98636F]">
                  Введите полный номер телефона в формате +7 (___) ___-__-__
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="pickup-address-input"
                className="flex items-center gap-2 text-sm font-medium text-[#4A3835] mb-2"
              >
                <MapPin className="w-4 h-4 text-[#98636F]" />
                <span>{INVITATION_CONFIG.datePlanner.addressLabel}</span>
                <span className="text-[#98636F]" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="pickup-address-input"
                type="text"
                autoComplete="street-address"
                required
                maxLength={200}
                value={address}
                onFocus={() => trackFieldFocus('address', 'Откуда тебя забрать?', 'planner:contacts')}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => setAddressTouched(true)}
                placeholder={INVITATION_CONFIG.datePlanner.addressPlaceholder}
                aria-invalid={addressTouched && !addressValid}
                className="w-full min-h-[48px] rounded-xl bg-[#F8EEE8]/65 border border-[#D8BD91]/60 px-4 py-2.5 text-base sm:text-sm text-[#4A3835] placeholder:text-[#725A55]/55 focus:outline-none focus:border-[#98636F]"
              />
              {addressTouched && !addressValid && (
                <p className="mt-1.5 text-xs text-[#98636F]">
                  Укажите адрес, откуда тебя забрать (минимум 3 символа)
                </p>
              )}
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="mt-5 rounded-2xl bg-[#F4D9DA]/45 border border-[#D9A0A6] p-3.5 flex items-start gap-2.5 text-sm text-[#4A3835]"
            >
              <AlertCircle className="w-4 h-4 text-[#98636F] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{submitError}</p>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || hasSubmitted}
              data-track="Отправить форму"
              className="w-full min-h-[52px] px-6 py-3.5 rounded-full bg-[#98636F] hover:bg-[#82525D] disabled:opacity-45 disabled:cursor-not-allowed text-[#FFF9F4] text-base font-medium shadow-[0_12px_28px_rgba(152,99,111,0.28)] flex items-center justify-center gap-2 transition-colors cursor-pointer touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Отправляем...</span>
                </>
              ) : hasSubmitted ? (
                <span>Отправлено ❤️</span>
              ) : submitError ? (
                <span>Повторить отправку</span>
              ) : (
                <span>{INVITATION_CONFIG.datePlanner.submitButtonLabel}</span>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting || hasSubmitted}
              data-track="Вернуться назад (к встрече)"
              data-track-role="back"
              onClick={() => handleBackToMeeting('Вернуться назад (к встрече)')}
              className="w-full min-h-[44px] text-sm text-[#725A55] hover:text-[#4A3835] disabled:opacity-45 transition-colors cursor-pointer"
            >
              ← Вернуться назад
            </button>
          </div>
        </motion.form>
      )}
    </section>
  );
}
