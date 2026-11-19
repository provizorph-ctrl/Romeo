export const FIXED_DATE_ISO = '2026-11-23';
export const FIXED_DATE_DISPLAY = '23 ноября 2026, 19:00';
export const FIXED_DATE_CARD_TEXT =
  'Давай встретимся 23 ноября 2026 (понедельник) в 19:00';

export interface RsvpPayload {
  accepted: boolean;
  date: string;
  timeSlot: string;
  phone: string;
  address: string;
  submissionId: string;
}

export interface RsvpValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: {
    date: string;
    timeSlot: string;
    phone: string;
    address: string;
    submissionId: string;
  };
}

/**
 * Извлекает до 10 цифр номера после кода +7.
 * Поддерживает вставку +7..., 8..., 7... и обычный посимвольный ввод.
 */
export function extractNationalPhoneDigits(
  input: string,
  prevFormatted = ''
): string {
  const digitsOnly = input.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // Если пользователь нажал Backspace на границе маски (кол-во цифр не изменилось), удаляем последнюю цифру
  if (prevFormatted && input.length < prevFormatted.length) {
    const prevDigits = extractNationalPhoneDigits(prevFormatted);
    if (digitsOnly.length === 11 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8'))) {
      const nextNat = digitsOnly.slice(1, 11);
      return nextNat === prevDigits ? prevDigits.slice(0, -1) : nextNat;
    }
    if (digitsOnly === prevDigits) {
      return prevDigits.slice(0, -1);
    }
  }

  // Полный 11-значный ввод/вставка (+7XXXXXXXXXX или 8XXXXXXXXXX)
  if (digitsOnly.length >= 11 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8'))) {
    return digitsOnly.slice(1, 11);
  }

  // Если с пустого поля начали ввод с "8", считаем это кодом страны +7
  if (!prevFormatted && digitsOnly === '8') {
    return '';
  }
  if (digitsOnly.startsWith('8') && digitsOnly.length > 1) {
    return digitsOnly.slice(1, 11);
  }

  // Если в строке явно был введен "+7" до номера (например, при вставке "+7 701")
  if (input.trim().startsWith('+7')) {
    return digitsOnly.startsWith('7') ? digitsOnly.slice(1, 11) : digitsOnly.slice(0, 10);
  }

  return digitsOnly.slice(0, 10);
}

export function formatPhoneMask(nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function normalizeAndValidatePhone(input: string): {
  valid: boolean;
  formatted: string;
} {
  const digits = extractNationalPhoneDigits(input);
  if (digits.length !== 10) {
    return { valid: false, formatted: formatPhoneMask(digits) };
  }
  return { valid: true, formatted: formatPhoneMask(digits) };
}

export function isValidPickupAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 3 && trimmed.length <= 200;
}

export function validateRsvpPayload(input: unknown): RsvpValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Некорректные данные приглашения.' };
  }

  const raw = input as Record<string, unknown>;

  if (raw.accepted !== true) {
    return { valid: false, error: 'Ответ должен быть подтвержден согласием.' };
  }

  const rawPhone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const phoneCheck = normalizeAndValidatePhone(rawPhone);
  if (!phoneCheck.valid) {
    return {
      valid: false,
      error: 'Укажите корректный номер телефона в формате +7 (___) ___-__-__.',
    };
  }

  const address = typeof raw.address === 'string' ? raw.address.trim().slice(0, 200) : '';
  if (!isValidPickupAddress(address)) {
    return { valid: false, error: 'Укажите, откуда тебя забрать.' };
  }

  const submissionId =
    typeof raw.submissionId === 'string' ? raw.submissionId.trim() : '';
  if (!submissionId || submissionId.length < 8 || submissionId.length > 100) {
    return { valid: false, error: 'Отсутствует идентификатор отправки.' };
  }

  return {
    valid: true,
    sanitized: {
      date: FIXED_DATE_ISO,
      timeSlot: '19:00',
      phone: phoneCheck.formatted,
      address,
      submissionId,
    },
  };
}

export function formatTelegramMessage(data: {
  phone: string;
  address: string;
}): string {
  return [
    '💌 Новый ответ на приглашение!',
    `📅 Дата: ${FIXED_DATE_DISPLAY}`,
    `📞 Телефон: ${data.phone}`,
    `📍 Забрать из: ${data.address}`,
  ].join('\n');
}
