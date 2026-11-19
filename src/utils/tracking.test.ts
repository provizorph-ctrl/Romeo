import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDurationMmSs,
  formatNotifyTelegramText,
} from './notifyFormatter.ts';
import {
  __flushQueueForTests,
  __resetTrackingForTests,
  flushAllBursts,
  getSessionCounters,
  trackBackClick,
  trackConsentClick,
  trackFieldFocus,
  trackFormSubmitted,
  trackNoAttempt,
  trackScreenChange,
  trackSiteOpened,
} from './tracking.ts';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem(k: string) {
      return map.has(k) ? map.get(k)! : null;
    },
    setItem(k: string, v: string) {
      map.set(k, String(v));
    },
    removeItem(k: string) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
  };
}

test('formatDurationMmSs formats minutes and seconds accurately', () => {
  assert.equal(formatDurationMmSs(0), '0:00');
  assert.equal(formatDurationMmSs(8), '0:08');
  assert.equal(formatDurationMmSs(75), '1:15');
  assert.equal(formatDurationMmSs(125), '2:05');
});

test('formatNotifyTelegramText renders no_click, no_batch, and exact visit_summary format', () => {
  const sampleDate = new Date('2026-11-18T12:00:00.000Z');

  const no3 = formatNotifyTelegramText(
    {
      eventName: 'no_click',
      sessionId: 'abc123456',
      visitNumber: 3,
      details: { buttonName: 'Нет', attempt: 3, screen: 'question', trigger: 'click' },
    },
    sampleDate
  );
  assert.match(no3, /🙅 Нажала «Нет» — 3-й раз/);
  assert.match(no3, /Визит №3 · Сессия #abc123/);
  assert.match(no3, /\(Almaty\)/);

  const batch = formatNotifyTelegramText(
    {
      eventName: 'no_batch',
      sessionId: 'abc123456',
      visitNumber: 3,
      details: { count: 5, durationSeconds: 8, totalNoClicks: 8, screen: 'question' },
    },
    sampleDate
  );
  assert.match(batch, /🙅 Нажала «Нет» ×5 за 8 сек \(всего попыток: 8\)/);

  const summary = formatNotifyTelegramText(
    {
      eventName: 'visit_summary',
      sessionId: 'abc123456',
      visitNumber: 3,
      counters: {
        noClicks: 4,
        backClicks: 1,
        screensVisited: 6,
        buttonClicks: 12,
        totalSeconds: 85,
      },
      details: {
        reachedScreen: 'final',
        formSubmitted: true,
      },
    },
    sampleDate
  );
  assert.match(summary, /^📊 Сводка визита №3/m);
  assert.match(summary, /^⏱ Время на сайте: 1:25/m);
  assert.match(summary, /^🧭 Дошла до экрана: Итог \(подтверждено\)/m);
  assert.match(summary, /^🙅 Нажатий «Нет»: 4/m);
  assert.match(summary, /^🔙 Нажатий «Назад»: 1/m);
  assert.match(summary, /^👆 Всего нажатий: 12/m);
  assert.match(summary, /^✅ Форма отправлена: да/m);
});

test('tracking deduplicates one-time events, batches >3 no clicks in 10s, and preserves counters across reload', () => {
  const local = createMemoryStorage();
  const session = createMemoryStorage();
  const sentTexts: string[] = [];

  (globalThis as Record<string, unknown>).window = {
    localStorage: local,
    sessionStorage: session,
    innerWidth: 390,
    innerHeight: 844,
    setTimeout,
    clearTimeout,
  };
  (globalThis as Record<string, unknown>).fetch = async (_url: unknown, init?: { body?: string }) => {
    if (init?.body) {
      const parsed = JSON.parse(init.body) as { text?: string };
      if (parsed.text) sentTexts.push(parsed.text);
    }
    return { ok: true } as Response;
  };

  __resetTrackingForTests();

  // Визит 1: открытие и дедупликация повторного site_opened / screen_view / field_focus
  trackSiteOpened('intro');
  trackSiteOpened('intro');
  __flushQueueForTests();
  assert.equal(sentTexts.filter((t) => t.includes('Открыла сайт')).length, 1);

  trackScreenChange('envelope');
  trackScreenChange('question');
  trackScreenChange('envelope'); // уже был посещен
  __flushQueueForTests();
  assert.equal(
    sentTexts.filter((t) => t.includes('Переход на экран: «Конверт')).length,
    1
  );

  trackFieldFocus('phone', 'Номер телефона', 'planner:contacts');
  trackFieldFocus('phone', 'Номер телефона', 'planner:contacts');
  __flushQueueForTests();
  assert.equal(sentTexts.filter((t) => t.includes('Первый фокус на поле')).length, 1);

  // Первые 3 нажатия «Нет» уходят сразу, 4..8 объединяются в один батч
  for (let i = 0; i < 8; i += 1) {
    trackNoAttempt(i % 2 === 0 ? 'click' : 'hover', 'Нет', 'question');
  }
  __flushQueueForTests();
  const immediateNo = sentTexts.filter((t) => t.includes('Нажала «Нет» —'));
  assert.equal(immediateNo.length, 3);

  flushAllBursts(false);
  __flushQueueForTests();
  const batchedNo = sentTexts.filter((t) => t.includes('Нажала «Нет» ×5'));
  assert.equal(batchedNo.length, 1);
  assert.match(batchedNo[0], /всего попыток: 8/);

  trackBackClick('planner:contacts', 'planner:meeting', 'Назад');
  trackConsentClick('Да! ❤️', 'question');

  const countersBeforeReload = getSessionCounters();
  assert.equal(countersBeforeReload.noClicks, 8);
  assert.equal(countersBeforeReload.backClicks, 1);
  assert.equal(countersBeforeReload.buttonClicks, 10);

  // Имитация перезагрузки страницы в рамках той же сессии (sessionStorage сохраняется)
  __resetTrackingForTests();
  trackSiteOpened('intro'); // не должно сработать повторно или увеличить счетчик визита
  __flushQueueForTests();
  const countersAfterReload = getSessionCounters();
  assert.equal(countersAfterReload.noClicks, 8);
  assert.equal(countersAfterReload.backClicks, 1);
  assert.equal(countersAfterReload.buttonClicks, 10);
  assert.equal(sentTexts.filter((t) => t.includes('Открыла сайт')).length, 1);

  // Отправка формы генерирует ОДНУ итоговую сводку
  trackFormSubmitted('planner:contacts');
  trackFormSubmitted('planner:contacts');
  __flushQueueForTests();
  assert.equal(sentTexts.filter((t) => t.includes('📊 Сводка визита')).length, 1);

  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).fetch;
});
