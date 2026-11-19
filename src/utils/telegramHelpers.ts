export function sanitizeTelegramToken(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (/^bot\d+:/i.test(cleaned)) {
    cleaned = cleaned.slice(3);
  }
  return cleaned;
}

export function sanitizeTelegramChatId(raw?: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  const tmeMatch = /^(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]{3,})$/i.exec(cleaned);
  if (tmeMatch) {
    return `@${tmeMatch[1]}`;
  }
  return cleaned;
}

interface TelegramUpdateChat {
  id?: number | string;
  username?: string;
}

interface TelegramUpdateUser {
  id?: number | string;
  username?: string;
}

interface TelegramUpdateMessage {
  chat?: TelegramUpdateChat;
  from?: TelegramUpdateUser;
}

interface TelegramUpdateItem {
  message?: TelegramUpdateMessage;
  edited_message?: TelegramUpdateMessage;
  channel_post?: TelegramUpdateMessage;
  my_chat_member?: TelegramUpdateMessage;
  callback_query?: {
    from?: TelegramUpdateUser;
    message?: TelegramUpdateMessage;
  };
}

export function findMatchingChatIdFromUpdates(
  updatesResult: unknown,
  targetChatId: string
): string | null {
  if (!Array.isArray(updatesResult)) return null;
  const normalizedTarget = sanitizeTelegramChatId(targetChatId);
  if (!normalizedTarget.startsWith('@')) return null;

  const expectedUsername = normalizedTarget.slice(1).toLowerCase();
  if (!expectedUsername) return null;

  for (let i = updatesResult.length - 1; i >= 0; i -= 1) {
    const item = updatesResult[i] as TelegramUpdateItem | null | undefined;
    if (!item || typeof item !== 'object') continue;

    const candidates: Array<TelegramUpdateMessage | undefined> = [
      item.message,
      item.edited_message,
      item.channel_post,
      item.my_chat_member,
      item.callback_query?.message,
    ];

    for (const msg of candidates) {
      if (!msg) continue;
      if (msg.chat?.username?.toLowerCase() === expectedUsername && msg.chat.id !== undefined) {
        return String(msg.chat.id);
      }
      if (msg.from?.username?.toLowerCase() === expectedUsername && msg.chat?.id !== undefined) {
        return String(msg.chat.id);
      }
      if (msg.from?.username?.toLowerCase() === expectedUsername && msg.from.id !== undefined) {
        return String(msg.from.id);
      }
    }

    if (
      item.callback_query?.from?.username?.toLowerCase() === expectedUsername &&
      item.callback_query.from.id !== undefined
    ) {
      return String(item.callback_query.from.id);
    }
  }

  return null;
}

export function buildTelegramFailureHint(description?: string): string {
  const lower = (description || '').toLowerCase();
  if (lower.includes('chat not found')) {
    return 'Укажите числовой TELEGRAM_CHAT_ID (а не @username) и обязательно нажмите /start в диалоге с ботом.';
  }
  if (lower.includes('bot was blocked')) {
    return 'Бот заблокирован в Telegram. Разблокируйте бота и нажмите /start.';
  }
  if (lower.includes('unauthorized')) {
    return 'Проверьте корректность TELEGRAM_BOT_TOKEN.';
  }
  return 'Проверьте TELEGRAM_BOT_TOKEN, числовой TELEGRAM_CHAT_ID и нажмите /start в диалоге с ботом.';
}
