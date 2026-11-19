import {
  formatNotifyTelegramText,
  getScreenLabel,
  type NotifyEventPayload,
  type SessionCountersSnapshot,
} from './notifyFormatter';

export type TrackingEventName =
  | 'site_opened'
  | 'screen_view'
  | 'screen_dwell'
  | 'button_click'
  | 'button_batch'
  | 'no_click'
  | 'no_batch'
  | 'agree_click'
  | 'back_click'
  | 'field_focus'
  | 'page_exit'
  | 'tab_return'
  | 'form_submitted'
  | 'visit_summary';

export interface TrackingSessionState {
  sessionId: string;
  visitNumber: number;
  counters: SessionCountersSnapshot;
  visitedScreens: string[];
  focusedFields: string[];
  siteOpenedSent: boolean;
  summarySent: boolean;
  formSubmitted: boolean;
  currentScreen: string;
  reachedScreen: string;
  lastTickAt: number;
  screenEnteredAt: number;
}

const VISIT_STORAGE_KEY = 'invitation_visit_counter_v1';
const SESSION_STORAGE_KEY = 'invitation_tracking_session_v1';
const BURST_WINDOW_MS = 10_000;
const BURST_IMMEDIATE_LIMIT = 3;
const BURST_DEBOUNCE_MS = 2_400;

interface BurstState {
  recentTimestamps: number[];
  bufferCount: number;
  bufferStartedAt: number;
  bufferScreen: string;
  bufferLabels: string[];
  flushTimer: number | null;
}

function createBurstState(): BurstState {
  return {
    recentTimestamps: [],
    bufferCount: 0,
    bufferStartedAt: 0,
    bufferScreen: 'intro',
    bufferLabels: [],
    flushTimer: null,
  };
}

let inMemorySession: TrackingSessionState | null = null;
let globalListenersAttached = false;
let heartbeatTimer: number | null = null;
let hiddenAt: number | null = null;
let isTabCurrentlyHidden = false;

const noBurst: BurstState = createBurstState();
const buttonBurst: BurstState = createBurstState();

const QUEUE_INTERVAL_MS = 1050;
const outgoingQueue: string[] = [];
let queueTimer: number | null = null;
let lastDispatchAt = 0;

function generateSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback below
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDeviceSummary(): string {
  try {
    if (typeof navigator === 'undefined') return 'Unknown device';
    const ua = navigator.userAgent || '';
    let os = 'Desktop';
    if (/iPhone/i.test(ua)) os = 'iPhone';
    else if (/iPad/i.test(ua)) os = 'iPad';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/YaBrowser/i.test(ua)) browser = 'Yandex';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/CriOS|Chrome/i.test(ua)) browser = 'Chrome';
    else if (/FxiOS|Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';

    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    const height = typeof window !== 'undefined' ? window.innerHeight : 0;
    const viewport = width && height ? ` · ${width}×${height}` : '';
    return `${os} (${browser})${viewport}`;
  } catch {
    return 'Browser';
  }
}

function readLocalVisitCounter(): number {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 1;
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed + 1 : 1;
    window.localStorage.setItem(VISIT_STORAGE_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

function persistSession(state: TrackingSessionState): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Игнорируем ограничения приватного режима / квоты
  }
}

export function getOrInitSession(initialScreen = 'intro'): TrackingSessionState {
  if (inMemorySession) return inMemorySession;

  const now = Date.now();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const savedRaw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as Partial<TrackingSessionState>;
        if (parsed && typeof parsed.sessionId === 'string' && parsed.counters) {
          inMemorySession = {
            sessionId: parsed.sessionId,
            visitNumber: typeof parsed.visitNumber === 'number' ? parsed.visitNumber : 1,
            counters: {
              noClicks: Number(parsed.counters.noClicks) || 0,
              backClicks: Number(parsed.counters.backClicks) || 0,
              screensVisited: Number(parsed.counters.screensVisited) || 0,
              buttonClicks: Number(parsed.counters.buttonClicks) || 0,
              totalSeconds: Number(parsed.counters.totalSeconds) || 0,
            },
            visitedScreens: Array.isArray(parsed.visitedScreens) ? parsed.visitedScreens : [],
            focusedFields: Array.isArray(parsed.focusedFields) ? parsed.focusedFields : [],
            siteOpenedSent: Boolean(parsed.siteOpenedSent),
            summarySent: Boolean(parsed.summarySent),
            formSubmitted: Boolean(parsed.formSubmitted),
            currentScreen:
              typeof parsed.currentScreen === 'string' ? parsed.currentScreen : initialScreen,
            reachedScreen:
              typeof parsed.reachedScreen === 'string' ? parsed.reachedScreen : initialScreen,
            lastTickAt: now,
            screenEnteredAt:
              typeof parsed.screenEnteredAt === 'number' ? parsed.screenEnteredAt : now,
          };
          persistSession(inMemorySession);
          return inMemorySession;
        }
      }
    }
  } catch {
    // Переходим к созданию новой сессии
  }

  const visitNumber = readLocalVisitCounter();
  inMemorySession = {
    sessionId: generateSessionId(),
    visitNumber,
    counters: {
      noClicks: 0,
      backClicks: 0,
      screensVisited: 0,
      buttonClicks: 0,
      totalSeconds: 0,
    },
    visitedScreens: [],
    focusedFields: [],
    siteOpenedSent: false,
    summarySent: false,
    formSubmitted: false,
    currentScreen: initialScreen,
    reachedScreen: initialScreen,
    lastTickAt: now,
    screenEnteredAt: now,
  };
  persistSession(inMemorySession);
  return inMemorySession;
}

export function getSessionCounters(): SessionCountersSnapshot {
  const session = getOrInitSession();
  syncElapsedSeconds(session);
  return { ...session.counters };
}

function syncElapsedSeconds(session: TrackingSessionState): void {
  const now = Date.now();
  if (!isTabCurrentlyHidden) {
    const deltaSec = Math.floor((now - session.lastTickAt) / 1000);
    if (deltaSec > 0) {
      session.counters.totalSeconds += deltaSec;
      session.lastTickAt += deltaSec * 1000;
      persistSession(session);
    }
  } else {
    session.lastTickAt = now;
  }
}

function postNotifyText(text: string, useBeacon = false): void {
  try {
    const json = JSON.stringify({ text });

    if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/notify', blob);
      if (queued) return;
    }

    if (typeof fetch === 'function') {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: useBeacon,
      }).catch(() => {
        // Ошибки доставки молча игнорируются, чтобы не мешать пользователю
      });
    }
  } catch {
    // Никогда не прерываем работу интерфейса из-за аналитики
  }
}

function pumpOutgoingQueue(): void {
  if (outgoingQueue.length === 0) return;

  const now = Date.now();
  const elapsed = now - lastDispatchAt;
  if (elapsed >= QUEUE_INTERVAL_MS && queueTimer === null) {
    const nextText = outgoingQueue.shift();
    if (nextText) {
      lastDispatchAt = now;
      postNotifyText(nextText, false);
    }
  }

  if (outgoingQueue.length > 0 && queueTimer === null && typeof window !== 'undefined') {
    const waitMs = Math.max(50, QUEUE_INTERVAL_MS - (Date.now() - lastDispatchAt));
    queueTimer = window.setTimeout(() => {
      queueTimer = null;
      const item = outgoingQueue.shift();
      if (item) {
        lastDispatchAt = Date.now();
        postNotifyText(item, false);
      }
      if (outgoingQueue.length > 0) {
        pumpOutgoingQueue();
      }
    }, waitMs);
  }
}

function dispatchToServer(
  payload: NotifyEventPayload,
  useBeacon = false
): void {
  try {
    const text = formatNotifyTelegramText(payload, new Date()).slice(0, 1000);
    if (!text) return;

    if (useBeacon) {
      if (queueTimer !== null && typeof window !== 'undefined') {
        window.clearTimeout(queueTimer);
        queueTimer = null;
      }
      // Сначала отправляем оставшиеся в очереди сообщения, затем текущее событие закрытия
      while (outgoingQueue.length > 0) {
        const pending = outgoingQueue.shift();
        if (pending) {
          postNotifyText(pending, true);
        }
      }
      postNotifyText(text, true);
      lastDispatchAt = Date.now();
      return;
    }

    if (outgoingQueue.length >= 100) {
      outgoingQueue.shift();
    }
    outgoingQueue.push(text);
    pumpOutgoingQueue();
  } catch {
    // Никогда не прерываем работу интерфейса из-за аналитики
  }
}

function flushBurst(kind: 'no' | 'button', useBeacon = false): void {
  const burst = kind === 'no' ? noBurst : buttonBurst;
  if (burst.flushTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(burst.flushTimer);
    burst.flushTimer = null;
  }

  if (burst.bufferCount <= 0) return;

  const session = getOrInitSession();
  syncElapsedSeconds(session);

  const durationSeconds = Math.max(1, Math.round((Date.now() - burst.bufferStartedAt) / 1000));
  const count = burst.bufferCount;
  const screen = burst.bufferScreen || session.currentScreen;
  const labels = [...burst.bufferLabels];

  burst.bufferCount = 0;
  burst.bufferStartedAt = 0;
  burst.bufferLabels = [];

  if (kind === 'no') {
    if (count === 1) {
      dispatchToServer(
        {
          eventName: 'no_click',
          sessionId: session.sessionId,
          visitNumber: session.visitNumber,
          clientTime: new Date().toISOString(),
          counters: { ...session.counters },
          details: {
            buttonName: labels[0] || 'Нет',
            attempt: session.counters.noClicks,
            trigger: 'click',
            screen,
          },
        },
        useBeacon
      );
      return;
    }

    dispatchToServer(
      {
        eventName: 'no_batch',
        sessionId: session.sessionId,
        visitNumber: session.visitNumber,
        clientTime: new Date().toISOString(),
        counters: { ...session.counters },
        details: {
          count,
          durationSeconds,
          totalNoClicks: session.counters.noClicks,
          screen,
        },
      },
      useBeacon
    );
    return;
  }

  if (count === 1) {
    dispatchToServer(
      {
        eventName: 'button_click',
        sessionId: session.sessionId,
        visitNumber: session.visitNumber,
        clientTime: new Date().toISOString(),
        counters: { ...session.counters },
        details: {
          buttonName: labels[0] || 'Кнопка',
          screen,
        },
      },
      useBeacon
    );
    return;
  }

  const labelCounts = new Map<string, number>();
  for (const label of labels) {
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  }
  const buttonsSummary = Array.from(labelCounts.entries())
    .slice(0, 4)
    .map(([name, c]) => (c > 1 ? `«${name}» ×${c}` : `«${name}»`))
    .join(', ');

  dispatchToServer(
    {
      eventName: 'button_batch',
      sessionId: session.sessionId,
      visitNumber: session.visitNumber,
      clientTime: new Date().toISOString(),
      counters: { ...session.counters },
      details: {
        count,
        durationSeconds,
        buttonsSummary,
        screen,
      },
    },
    useBeacon
  );
}

export function flushAllBursts(useBeacon = false): void {
  flushBurst('no', useBeacon);
  flushBurst('button', useBeacon);
}

/**
 * Единая точка отправки аналитических событий на сервер (/api/notify).
 */
export function trackEvent(
  eventName: TrackingEventName,
  details: Record<string, unknown> = {}
): void {
  try {
    const session = getOrInitSession();
    syncElapsedSeconds(session);
    const now = Date.now();
    const useBeacon = Boolean(details.useBeacon);

    // Дедупликация одноразовых событий за сессию
    if (eventName === 'site_opened') {
      if (session.siteOpenedSent) return;
      session.siteOpenedSent = true;
      const startScreen =
        typeof details.screen === 'string' ? details.screen : session.currentScreen;
      if (!session.visitedScreens.includes(startScreen)) {
        session.visitedScreens.push(startScreen);
        session.counters.screensVisited = session.visitedScreens.length;
      }
      persistSession(session);
    }

    if (eventName === 'screen_view') {
      const targetScreen = typeof details.screen === 'string' ? details.screen : '';
      if (!targetScreen) return;

      const isFirstVisit = !session.visitedScreens.includes(targetScreen);
      if (isFirstVisit) {
        session.visitedScreens.push(targetScreen);
        session.counters.screensVisited = session.visitedScreens.length;
      }

      session.currentScreen = targetScreen;
      session.reachedScreen = targetScreen;
      session.screenEnteredAt = now;
      persistSession(session);

      if (!isFirstVisit) {
        return;
      }
    }

    if (eventName === 'field_focus') {
      const fieldKey = typeof details.field === 'string' ? details.field : '';
      if (!fieldKey || session.focusedFields.includes(fieldKey)) return;
      session.focusedFields.push(fieldKey);
      persistSession(session);
    }

    if (eventName === 'visit_summary') {
      if (session.summarySent) return;
      session.summarySent = true;
      persistSession(session);
    }

    // Батчинг частых нажатий «Нет» (>3 за 10 сек)
    if (eventName === 'no_click') {
      noBurst.recentTimestamps = noBurst.recentTimestamps.filter(
        (ts) => now - ts <= BURST_WINDOW_MS
      );
      noBurst.recentTimestamps.push(now);

      if (noBurst.recentTimestamps.length > BURST_IMMEDIATE_LIMIT) {
        if (noBurst.bufferCount === 0) {
          noBurst.bufferStartedAt = now;
        }
        noBurst.bufferCount += 1;
        noBurst.bufferScreen =
          typeof details.screen === 'string' ? details.screen : session.currentScreen;

        if (noBurst.flushTimer !== null && typeof window !== 'undefined') {
          window.clearTimeout(noBurst.flushTimer);
        }
        const elapsed = now - noBurst.bufferStartedAt;
        const delay = Math.max(400, Math.min(BURST_DEBOUNCE_MS, BURST_WINDOW_MS - elapsed));
        if (typeof window !== 'undefined') {
          noBurst.flushTimer = window.setTimeout(() => flushBurst('no', false), delay);
        }
        return;
      }
    }

    // Батчинг частых обычных кликов (>3 за 10 сек)
    if (eventName === 'button_click') {
      buttonBurst.recentTimestamps = buttonBurst.recentTimestamps.filter(
        (ts) => now - ts <= BURST_WINDOW_MS
      );
      buttonBurst.recentTimestamps.push(now);

      if (buttonBurst.recentTimestamps.length > BURST_IMMEDIATE_LIMIT) {
        if (buttonBurst.bufferCount === 0) {
          buttonBurst.bufferStartedAt = now;
        }
        buttonBurst.bufferCount += 1;
        buttonBurst.bufferScreen =
          typeof details.screen === 'string' ? details.screen : session.currentScreen;
        if (typeof details.buttonName === 'string' && details.buttonName) {
          buttonBurst.bufferLabels.push(details.buttonName);
        }

        if (buttonBurst.flushTimer !== null && typeof window !== 'undefined') {
          window.clearTimeout(buttonBurst.flushTimer);
        }
        const elapsed = now - buttonBurst.bufferStartedAt;
        const delay = Math.max(400, Math.min(BURST_DEBOUNCE_MS, BURST_WINDOW_MS - elapsed));
        if (typeof window !== 'undefined') {
          buttonBurst.flushTimer = window.setTimeout(() => flushBurst('button', false), delay);
        }
        return;
      }
    }

    dispatchToServer(
      {
        eventName,
        sessionId: session.sessionId,
        visitNumber: session.visitNumber,
        clientTime: new Date().toISOString(),
        counters: { ...session.counters },
        details,
      },
      useBeacon
    );
  } catch {
    // Безопасное подавление любых ошибок трекинга
  }
}

export function trackSiteOpened(initialScreen: string): void {
  const session = getOrInitSession(initialScreen);
  trackEvent('site_opened', {
    screen: initialScreen,
    device: getDeviceSummary(),
    visitNumber: session.visitNumber,
  });
}

export function trackScreenChange(nextScreen: string): void {
  try {
    const session = getOrInitSession(nextScreen);
    if (session.currentScreen === nextScreen) return;

    flushAllBursts(false);

    const previousScreen = session.currentScreen;
    const previousDurationSeconds = Math.max(
      0,
      Math.round((Date.now() - session.screenEnteredAt) / 1000)
    );

    const alreadyVisited = session.visitedScreens.includes(nextScreen);

    trackEvent('screen_view', {
      screen: nextScreen,
      previousScreen,
      previousDurationSeconds,
    });

    // Если экран уже посещался ранее (напр. после "Назад"), все равно зафиксируем время на покинутом экране
    if (alreadyVisited && previousDurationSeconds >= 1) {
      trackEvent('screen_dwell', {
        screen: previousScreen,
        durationSeconds: previousDurationSeconds,
      });
    }
  } catch {
    // Игнорируем
  }
}

export function trackNoAttempt(
  trigger: 'click' | 'hover',
  buttonName = 'Нет',
  screenOverride?: string
): number {
  const session = getOrInitSession();
  syncElapsedSeconds(session);
  session.counters.noClicks += 1;
  session.counters.buttonClicks += 1;
  persistSession(session);

  const attempt = session.counters.noClicks;
  trackEvent('no_click', {
    buttonName,
    attempt,
    trigger,
    screen: screenOverride || session.currentScreen,
  });
  return attempt;
}

export function trackConsentClick(buttonName: string, screenOverride?: string): void {
  flushAllBursts(false);
  const session = getOrInitSession();
  syncElapsedSeconds(session);
  session.counters.buttonClicks += 1;
  persistSession(session);

  trackEvent('agree_click', {
    buttonName,
    noClicksBefore: session.counters.noClicks,
    screen: screenOverride || session.currentScreen,
  });
}

export function trackBackClick(
  fromScreen: string,
  toScreen: string,
  buttonName = 'Назад'
): void {
  flushAllBursts(false);
  const session = getOrInitSession();
  syncElapsedSeconds(session);
  session.counters.backClicks += 1;
  session.counters.buttonClicks += 1;

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - session.screenEnteredAt) / 1000)
  );
  persistSession(session);

  trackEvent('back_click', {
    fromScreen,
    toScreen,
    buttonName,
    durationSeconds,
    screen: fromScreen,
  });
}

export function trackFieldFocus(
  field: string,
  fieldLabel: string,
  screenOverride?: string
): void {
  const session = getOrInitSession();
  trackEvent('field_focus', {
    field,
    fieldLabel,
    screen: screenOverride || session.currentScreen,
  });
}

export function trackFormSubmitted(screenOverride = 'planner:contacts'): void {
  flushAllBursts(false);
  const session = getOrInitSession();
  syncElapsedSeconds(session);
  session.formSubmitted = true;
  persistSession(session);

  trackEvent('form_submitted', { screen: screenOverride });
  trackEvent('visit_summary', {
    reachedScreen: session.reachedScreen || session.currentScreen,
    formSubmitted: true,
  });
}

function sendExitBeacon(isClosing: boolean): void {
  try {
    flushAllBursts(true);
    const session = getOrInitSession();
    syncElapsedSeconds(session);

    const screenSeconds = Math.max(
      0,
      Math.round((Date.now() - session.screenEnteredAt) / 1000)
    );

    trackEvent('page_exit', {
      screen: session.currentScreen,
      screenSeconds,
      isClosing,
      useBeacon: true,
    });

    if (isClosing && !session.summarySent) {
      trackEvent('visit_summary', {
        reachedScreen: session.reachedScreen || session.currentScreen,
        formSubmitted: session.formSubmitted,
        useBeacon: true,
      });
    }
  } catch {
    // Игнорируем
  }
}

/**
 * Подключает глобальный обработчик кликов по [data-track]/button/a/[role="button"],
 * жизненный цикл вкладки (visibilitychange / pagehide) и секундный таймер времени на сайте.
 */
export function initGlobalTracking(initialScreen: string): () => void {
  getOrInitSession(initialScreen);
  trackSiteOpened(initialScreen);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (globalListenersAttached) {
    return () => {};
  }
  globalListenersAttached = true;

  const handleDocumentClick = (e: MouseEvent) => {
    try {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;

      const interactive = target.closest(
        '[data-track], button, a, [role="button"]'
      ) as HTMLElement | null;
      if (!interactive) return;

      if (
        (interactive as HTMLButtonElement).disabled ||
        interactive.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      const role = interactive.getAttribute('data-track-role');
      // Кнопки с особой логикой («Нет», «Да/Согласна», «Назад») фиксируются через свои события без дубля
      if (role === 'no' || role === 'agree' || role === 'back') {
        return;
      }

      const rawLabel =
        interactive.getAttribute('data-track') ||
        interactive.getAttribute('aria-label') ||
        interactive.textContent ||
        'Кнопка';
      const buttonName = rawLabel.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!buttonName) return;

      const session = getOrInitSession();
      syncElapsedSeconds(session);
      session.counters.buttonClicks += 1;
      persistSession(session);

      trackEvent('button_click', {
        buttonName,
        screen: session.currentScreen,
      });
    } catch {
      // Игнорируем
    }
  };

  const handleVisibilityChange = () => {
    try {
      const session = getOrInitSession();
      if (document.visibilityState === 'hidden') {
        syncElapsedSeconds(session);
        isTabCurrentlyHidden = true;
        hiddenAt = Date.now();
        sendExitBeacon(false);
      } else if (document.visibilityState === 'visible') {
        isTabCurrentlyHidden = false;
        session.lastTickAt = Date.now();
        persistSession(session);
        if (hiddenAt !== null) {
          hiddenAt = null;
          trackEvent('tab_return', {
            screen: session.currentScreen,
          });
        }
      }
    } catch {
      // Игнорируем
    }
  };

  const handlePageHide = () => {
    sendExitBeacon(true);
  };

  document.addEventListener('click', handleDocumentClick, { capture: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  heartbeatTimer = window.setInterval(() => {
    try {
      if (inMemorySession && !isTabCurrentlyHidden) {
        syncElapsedSeconds(inMemorySession);
      }
    } catch {
      // Игнорируем
    }
  }, 1000);

  return () => {
    document.removeEventListener('click', handleDocumentClick, { capture: true });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    globalListenersAttached = false;
  };
}

export function __flushQueueForTests(): void {
  if (queueTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(queueTimer);
    queueTimer = null;
  }
  while (outgoingQueue.length > 0) {
    const item = outgoingQueue.shift();
    if (item) {
      postNotifyText(item, false);
    }
  }
}

/**
 * Удобный сброс состояния модульных переменных (используется в unit-тестах).
 */
export function __resetTrackingForTests(): void {
  inMemorySession = null;
  hiddenAt = null;
  isTabCurrentlyHidden = false;
  lastDispatchAt = 0;
  outgoingQueue.length = 0;
  if (queueTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(queueTimer);
    queueTimer = null;
  }
  for (const b of [noBurst, buttonBurst]) {
    if (b.flushTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(b.flushTimer);
    }
    b.recentTimestamps = [];
    b.bufferCount = 0;
    b.bufferStartedAt = 0;
    b.bufferLabels = [];
    b.flushTimer = null;
  }
}

export { getScreenLabel };
