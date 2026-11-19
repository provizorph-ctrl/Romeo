export interface CalendarDayCell {
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isSelectable: boolean;
}

const MONTH_NAMES_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const WEEKDAY_NAMES_LONG = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
];

export const WEEKDAY_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function isDateSelectable(
  iso: string,
  todayIso: string = toIsoDate(new Date()),
  maxDaysAhead: number = 90
): boolean {
  const date = parseIsoDate(iso);
  const today = parseIsoDate(todayIso);
  if (!date || !today) return false;
  const maxDateIso = addDaysIso(todayIso, maxDaysAhead);
  return iso >= todayIso && iso <= maxDateIso;
}

export function getMonthLabelRu(year: number, monthIndex: number): string {
  return `${MONTH_NAMES_NOMINATIVE[monthIndex]} ${year}`;
}

export function formatRussianDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const day = date.getDate();
  const month = MONTH_NAMES_GENITIVE[date.getMonth()];
  const weekday = WEEKDAY_NAMES_LONG[date.getDay()];
  return `${day} ${month}, ${weekday}`;
}

/**
 * Генерирует сетку месяца (пн–вс) для интерактивного календаря.
 */
export function getMonthCalendarDays(
  year: number,
  monthIndex: number,
  todayIso: string = toIsoDate(new Date())
): CalendarDayCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Monday-first offset: 0 = Monday ... 6 = Sunday
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;

  const cells: CalendarDayCell[] = [];
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(year, monthIndex, 1 - mondayOffset + i);
    const iso = toIsoDate(cellDate);
    const isCurrentMonth = cellDate.getMonth() === monthIndex;
    const isPast = iso < todayIso;
    const dayOfWeek = cellDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cells.push({
      iso,
      dayNumber: cellDate.getDate(),
      isCurrentMonth,
      isToday: iso === todayIso,
      isPast,
      isWeekend,
      isSelectable: isCurrentMonth && isDateSelectable(iso, todayIso),
    });
  }

  return cells;
}

export type QuickDateFilter = 'soon' | 'weekend' | 'custom';

/**
 * Возвращает ближайшие удобные даты для быстрых кнопок выбора.
 */
export function getSuggestedDateForFilter(
  filter: QuickDateFilter,
  todayIso: string = toIsoDate(new Date())
): string | null {
  const today = parseIsoDate(todayIso);
  if (!today) return null;

  if (filter === 'soon') {
    // Предлагаем завтрашний день как наиболее комфортный ближайший вариант
    return addDaysIso(todayIso, 1);
  }

  if (filter === 'weekend') {
    // Находим ближайшую субботу (или воскресенье, если сегодня уже суббота/воскресенье)
    for (let offset = 0; offset <= 7; offset++) {
      const candidateIso = addDaysIso(todayIso, offset);
      const candidate = parseIsoDate(candidateIso);
      if (!candidate) continue;
      const dow = candidate.getDay();
      if (dow === 6 || dow === 0) {
        return candidateIso;
      }
    }
  }

  return null;
}
