import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysIso,
  formatRussianDate,
  getMonthCalendarDays,
  getSuggestedDateForFilter,
  isDateSelectable,
} from './datePlanner';

test('isDateSelectable rejects past dates and accepts today/future within range', () => {
  const today = '2026-11-16';
  assert.equal(isDateSelectable('2026-11-15', today), false);
  assert.equal(isDateSelectable('2026-11-16', today), true);
  assert.equal(isDateSelectable('2026-11-25', today), true);
  assert.equal(isDateSelectable('2027-06-01', today), false);
  assert.equal(isDateSelectable('2026-02-31', today), false);
});

test('getMonthCalendarDays creates Monday-first grid with proper past flags', () => {
  const today = '2026-11-16';
  const days = getMonthCalendarDays(2026, 10, today); // November 2026 (0-indexed month 10)
  assert.equal(days.length % 7, 0);

  const nov15 = days.find((d) => d.iso === '2026-11-15');
  const nov16 = days.find((d) => d.iso === '2026-11-16');
  const nov21 = days.find((d) => d.iso === '2026-11-21');

  assert.ok(nov15 && nov16 && nov21);
  assert.equal(nov15.isPast, true);
  assert.equal(nov15.isSelectable, false);
  assert.equal(nov16.isToday, true);
  assert.equal(nov16.isSelectable, true);
  assert.equal(nov21.isWeekend, true);
  assert.equal(nov21.isSelectable, true);
});

test('getSuggestedDateForFilter resolves soon and weekend dates', () => {
  // 2026-11-16 is a Monday
  const today = '2026-11-16';
  assert.equal(getSuggestedDateForFilter('soon', today), '2026-11-17');
  assert.equal(getSuggestedDateForFilter('weekend', today), '2026-11-21');
  assert.equal(getSuggestedDateForFilter('custom', today), null);
  assert.equal(addDaysIso(today, 5), '2026-11-21');
});

test('formatRussianDate formats human-readable Russian label', () => {
  assert.equal(formatRussianDate('2026-11-21'), '21 ноября, суббота');
});
