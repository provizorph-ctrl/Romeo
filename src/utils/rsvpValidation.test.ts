import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractNationalPhoneDigits,
  formatPhoneMask,
  formatTelegramMessage,
  isValidPickupAddress,
  normalizeAndValidatePhone,
  validateRsvpPayload,
} from './rsvpValidation';

test('phone mask formats partial and full +7 numbers cleanly', () => {
  const full = extractNationalPhoneDigits('+7 (701) 234-56-78');
  assert.equal(full, '7012345678');
  assert.equal(formatPhoneMask(full), '+7 (701) 234-56-78');

  const fromEight = extractNationalPhoneDigits('87012345678');
  assert.equal(fromEight, '7012345678');
  assert.equal(formatPhoneMask(fromEight), '+7 (701) 234-56-78');

  const partial = extractNationalPhoneDigits('70123');
  assert.equal(formatPhoneMask(partial), '+7 (701) 23');

  const checkOk = normalizeAndValidatePhone('8 (777) 123-45-67');
  assert.equal(checkOk.valid, true);
  assert.equal(checkOk.formatted, '+7 (777) 123-45-67');

  const checkShort = normalizeAndValidatePhone('+7 (777) 123-45');
  assert.equal(checkShort.valid, false);
});

test('validateRsvpPayload rejects invalid phone or empty address', () => {
  const badPhone = validateRsvpPayload({
    accepted: true,
    phone: '+7 (701) 12',
    address: 'пр. Достык, 10',
    submissionId: 'sub-12345678',
  });
  assert.equal(badPhone.valid, false);

  const badAddr = validateRsvpPayload({
    accepted: true,
    phone: '+7 (701) 234-56-78',
    address: '  ',
    submissionId: 'sub-12345678',
  });
  assert.equal(badAddr.valid, false);
  assert.equal(isValidPickupAddress('ул. Абая, 50'), true);
});

test('validateRsvpPayload accepts valid contact submission and normalizes fields', () => {
  const result = validateRsvpPayload({
    accepted: true,
    phone: '87012345678',
    address: '  ЖК Арман, 2 подъезд  ',
    submissionId: 'sub-12345678',
  });
  assert.equal(result.valid, true);
  assert.equal(result.sanitized?.date, '2026-11-23');
  assert.equal(result.sanitized?.timeSlot, '19:00');
  assert.equal(result.sanitized?.phone, '+7 (701) 234-56-78');
  assert.equal(result.sanitized?.address, 'ЖК Арман, 2 подъезд');
});

test('formatTelegramMessage renders exact requested Russian format', () => {
  const msg = formatTelegramMessage({
    phone: '+7 (701) 234-56-78',
    address: 'ул. Абая, 50',
  });
  assert.equal(
    msg,
    [
      '💌 Новый ответ на приглашение!',
      '📅 Дата: 23 ноября 2026, 19:00',
      '📞 Телефон: +7 (701) 234-56-78',
      '📍 Забрать из: ул. Абая, 50',
    ].join('\n')
  );
});
