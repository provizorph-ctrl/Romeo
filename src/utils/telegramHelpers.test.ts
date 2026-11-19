import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeTelegramToken,
  sanitizeTelegramChatId,
  findMatchingChatIdFromUpdates,
  buildTelegramFailureHint,
} from './telegramHelpers';

test('sanitizeTelegramToken strips quotes, whitespace, and bot prefix', () => {
  assert.equal(sanitizeTelegramToken('  "bot123456:ABC-xyz"  '), '123456:ABC-xyz');
  assert.equal(sanitizeTelegramToken("'98765:DEF'"), '98765:DEF');
  assert.equal(sanitizeTelegramToken(undefined), '');
});

test('sanitizeTelegramChatId strips quotes and normalizes t.me links', () => {
  assert.equal(sanitizeTelegramChatId(' "123456789" '), '123456789');
  assert.equal(sanitizeTelegramChatId('https://t.me/BakyzhanTest'), '@BakyzhanTest');
  assert.equal(sanitizeTelegramChatId('t.me/some_user'), '@some_user');
  assert.equal(sanitizeTelegramChatId(' -100123456 '), '-100123456');
});

test('findMatchingChatIdFromUpdates resolves @username to numeric chat id', () => {
  const updates = [
    {
      update_id: 1,
      message: {
        from: { id: 111222333, username: 'other_user' },
        chat: { id: 111222333, username: 'other_user' },
      },
    },
    {
      update_id: 2,
      message: {
        from: { id: 555666777, username: 'BakytzhanUser' },
        chat: { id: 555666777, username: 'BakytzhanUser' },
      },
    },
  ];

  assert.equal(findMatchingChatIdFromUpdates(updates, '@bakytzhanuser'), '555666777');
  assert.equal(findMatchingChatIdFromUpdates(updates, '@unknown'), null);
  assert.equal(findMatchingChatIdFromUpdates(updates, '555666777'), null);
});

test('buildTelegramFailureHint maps chat not found to actionable Russian hint', () => {
  const hint = buildTelegramFailureHint('Bad Request: chat not found');
  assert.match(hint, /TELEGRAM_CHAT_ID/);
  assert.match(hint, /\/start/);
});
