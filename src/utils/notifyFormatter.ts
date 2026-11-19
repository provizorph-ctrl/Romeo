export const SCREEN_LABELS: Record<string, string> = {
  intro: 'Интро-экран',
  envelope: 'Конверт (письмо)',
  story: 'История знакомства',
  about: 'Знакомство (О себе)',
  transition: 'Подводка к вопросу',
  question: 'Главный вопрос (Свидание)',
  'planner:meeting': 'Встреча (подтверждение даты)',
  'planner:contacts': 'Контакты (форма)',
  final: 'Итог (подтверждено)',
};

export function getScreenLabel(screenId?: string): string {
  if (!screenId) return 'Неизвестный экран';
  return SCREEN_LABELS[screenId] || screenId;
}

export function formatAlmatyTimestamp(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatDurationMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export interface SessionCountersSnapshot {
  noClicks: number;
  backClicks: number;
  screensVisited: number;
  buttonClicks: number;
  totalSeconds: number;
}

export interface NotifyEventPayload {
  eventName: string;
  sessionId: string;
  visitNumber: number;
  clientTime?: string;
  details?: Record<string, unknown>;
  counters?: SessionCountersSnapshot;
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function asNumber(val: unknown, fallback = 0): number {
  return typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.round(val)) : fallback;
}

export function formatNotifyTelegramText(
  payload: NotifyEventPayload,
  now: Date = new Date()
): string {
  const shortSession = asString(payload.sessionId, 'unknown').slice(0, 6);
  const visitNum = Math.max(1, asNumber(payload.visitNumber, 1));
  const almatyTime = formatAlmatyTimestamp(now);
  const metaFooter = `🕒 ${almatyTime} (Almaty) · Визит №${visitNum} · Сессия #${shortSession}`;
  const details = payload.details || {};

  switch (payload.eventName) {
    case 'site_opened': {
      const device = asString(details.device, 'Неизвестное устройство');
      const screenName = getScreenLabel(asString(details.screen, 'intro'));
      return [
        `👀 Открыла сайт (визит №${visitNum})`,
        `📱 Устройство: ${device}`,
        `🧭 Старт: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'screen_view': {
      const screenName = getScreenLabel(asString(details.screen));
      const prevScreenId = asString(details.previousScreen);
      const prevDuration = asNumber(details.previousDurationSeconds, -1);
      const lines = [`🧭 Переход на экран: «${screenName}»`];
      if (prevScreenId && prevDuration >= 0) {
        lines.push(`⏱ На экране «${getScreenLabel(prevScreenId)}»: ${prevDuration} сек`);
      }
      lines.push(metaFooter);
      return lines.join('\n');
    }

    case 'screen_dwell': {
      const screenName = getScreenLabel(asString(details.screen));
      const seconds = asNumber(details.durationSeconds, 0);
      return [
        `⏱ Время на экране «${screenName}»: ${seconds} сек`,
        metaFooter,
      ].join('\n');
    }

    case 'button_click': {
      const buttonName = asString(details.buttonName, 'Кнопка');
      const screenName = getScreenLabel(asString(details.screen));
      return [
        `👆 Нажала кнопку «${buttonName}»`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'button_batch': {
      const count = Math.max(1, asNumber(details.count, 1));
      const durationSec = Math.max(1, asNumber(details.durationSeconds, 1));
      const screenName = getScreenLabel(asString(details.screen));
      const summary = asString(details.buttonsSummary, 'Кнопки');
      return [
        `👆 Серия нажатий ×${count} за ${durationSec} сек`,
        `🔘 Кнопки: ${summary}`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'no_click': {
      const attempt = Math.max(1, asNumber(details.attempt, 1));
      const trigger = asString(details.trigger, 'click');
      const label = asString(details.buttonName, 'Нет');
      const screenName = getScreenLabel(asString(details.screen));
      const triggerNote = trigger === 'hover' ? ' (попытка наведения)' : '';
      return [
        `🙅 Нажала «${label}» — ${attempt}-й раз${triggerNote}`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'no_batch': {
      const count = Math.max(1, asNumber(details.count, 1));
      const durationSec = Math.max(1, asNumber(details.durationSeconds, 1));
      const totalNo = asNumber(details.totalNoClicks, count);
      const screenName = getScreenLabel(asString(details.screen));
      return [
        `🙅 Нажала «Нет» ×${count} за ${durationSec} сек (всего попыток: ${totalNo})`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'agree_click': {
      const buttonName = asString(details.buttonName, 'Да');
      const noBefore = asNumber(details.noClicksBefore, 0);
      const screenName = getScreenLabel(asString(details.screen));
      return [
        `💚 Нажала «${buttonName}»`,
        `🙅 Нажатий «Нет» до этого: ${noBefore}`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'back_click': {
      const fromName = getScreenLabel(asString(details.fromScreen));
      const toName = getScreenLabel(asString(details.toScreen));
      const spent = asNumber(details.durationSeconds, -1);
      const lines = [`🔙 Нажала «Назад»: ${fromName} → ${toName}`];
      if (spent >= 0) {
        lines.push(`⏱ На экране «${fromName}»: ${spent} сек`);
      }
      lines.push(metaFooter);
      return lines.join('\n');
    }

    case 'field_focus': {
      const fieldLabel = asString(details.fieldLabel, asString(details.field, 'Поле'));
      const screenName = getScreenLabel(asString(details.screen));
      return [
        `⌨️ Первый фокус на поле: «${fieldLabel}»`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'page_exit': {
      const screenName = getScreenLabel(asString(details.screen));
      const reason = details.isClosing ? 'Закрыла страницу' : 'Ушла со вкладки';
      const spent = asNumber(details.screenSeconds, -1);
      const lines = [
        `❌ ${reason}`,
        `🧭 Остановилась на экране: ${screenName}`,
      ];
      if (spent >= 0) {
        lines.push(`⏱ На этом экране: ${spent} сек`);
      }
      lines.push(metaFooter);
      return lines.join('\n');
    }

    case 'tab_return': {
      const screenName = getScreenLabel(asString(details.screen));
      return [
        `🔁 Вернулась на вкладку`,
        `🧭 Текущий экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'form_submitted': {
      const screenName = getScreenLabel(asString(details.screen, 'planner:contacts'));
      return [
        `✅ Отправила форму контактов`,
        `🧭 Экран: ${screenName}`,
        metaFooter,
      ].join('\n');
    }

    case 'visit_summary': {
      const counters = payload.counters || {
        noClicks: 0,
        backClicks: 0,
        screensVisited: 1,
        buttonClicks: 0,
        totalSeconds: 0,
      };
      const reachedScreen = getScreenLabel(asString(details.reachedScreen, 'intro'));
      const submitted = Boolean(details.formSubmitted);
      return [
        `📊 Сводка визита №${visitNum}`,
        `⏱ Время на сайте: ${formatDurationMmSs(counters.totalSeconds)}`,
        `🧭 Дошла до экрана: ${reachedScreen}`,
        `🙅 Нажатий «Нет»: ${counters.noClicks}`,
        `🔙 Нажатий «Назад»: ${counters.backClicks}`,
        `👆 Всего нажатий: ${counters.buttonClicks}`,
        `✅ Форма отправлена: ${submitted ? 'да' : 'нет'}`,
        metaFooter,
      ].join('\n');
    }

    default: {
      return [
        `📌 Событие: ${payload.eventName}`,
        metaFooter,
      ].join('\n');
    }
  }
}
