import { formatTelegramMessage, validateRsvpPayload } from '../utils/rsvpValidation';

export interface SubmitRsvpRequest {
  accepted: true;
  date: string;
  timeSlot: string;
  phone: string;
  address: string;
  submissionId: string;
}

export interface SubmitRsvpResponse {
  ok: boolean;
  telegramSent?: boolean;
  mode?: 'telegram' | 'demo' | 'saved';
  telegramWarning?: string;
  duplicate?: boolean;
  savedAt?: string;
  error?: string;
}

const submittedIds = new Set<string>();

export async function submitRsvp(payload: SubmitRsvpRequest): Promise<SubmitRsvpResponse> {
  if (submittedIds.has(payload.submissionId)) {
    return {
      ok: true,
      duplicate: true,
      telegramSent: true,
      mode: 'telegram',
      savedAt: new Date().toISOString(),
    };
  }

  const validation = validateRsvpPayload(payload);
  if (!validation.valid || !validation.sanitized) {
    throw new Error(validation.error || 'Проверьте корректность введенных данных.');
  }

  const text = formatTelegramMessage({
    phone: validation.sanitized.phone,
    address: validation.sanitized.address,
  }).slice(0, 1000);

  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  let data: { ok?: boolean };
  try {
    data = (await res.json()) as { ok?: boolean };
  } catch {
    throw new Error('Сервер вернул некорректный ответ. Попробуйте еще раз.');
  }

  if (!res.ok || !data.ok) {
    throw new Error('Не удалось отправить ответ. Попробуйте еще раз.');
  }

  submittedIds.add(payload.submissionId);

  return {
    ok: true,
    telegramSent: true,
    mode: 'telegram',
    savedAt: new Date().toISOString(),
  };
}
