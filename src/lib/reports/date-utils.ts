import { addDays } from 'date-fns';

export type DateRangeKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth';

export interface DateRange {
  start: Date;
  end: Date;
}

function getTodayStart(timezone: string): Date {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(`${dateStr}T00:00:00Z`);
}

function getWeekStart(date: Date, timezone: string): Date {
  const dayName = date.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'long' });
  const dayMap: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const currentDay = dayMap[dayName] ?? 0;
  return addDays(date, -currentDay);
}

function getMonthStart(date: Date, timezone: string): Date {
  const parts = date.toLocaleDateString('en-CA', { timeZone: timezone }).split('-');
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10);
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`);
}

export function getDateRange(timezone: string, key: DateRangeKey): DateRange {
  const todayStart = getTodayStart(timezone);
  const todayEnd = addDays(todayStart, 1);

  switch (key) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case 'yesterday':
      return { start: addDays(todayStart, -1), end: todayStart };
    case 'last7':
      return { start: addDays(todayStart, -7), end: todayEnd };
    case 'last30':
      return { start: addDays(todayStart, -30), end: todayEnd };
    case 'thisWeek': {
      const weekStart = getWeekStart(todayStart, timezone);
      return { start: weekStart, end: addDays(weekStart, 7) };
    }
    case 'lastWeek': {
      const thisWeekStart = getWeekStart(todayStart, timezone);
      return { start: addDays(thisWeekStart, -7), end: thisWeekStart };
    }
    case 'thisMonth': {
      const monthStart = getMonthStart(todayStart, timezone);
      const nextMonth = addDays(monthStart, 32);
      const nextMonthStart = getMonthStart(nextMonth, timezone);
      return { start: monthStart, end: nextMonthStart };
    }
    case 'lastMonth': {
      const thisMonthStart = getMonthStart(todayStart, timezone);
      const lastMonthStart = getMonthStart(addDays(thisMonthStart, -1), timezone);
      return { start: lastMonthStart, end: thisMonthStart };
    }
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - duration),
    end: new Date(range.start),
  };
}

export function getDailyBuckets(start: Date, end: Date): Date[] {
  const buckets: Date[] = [];
  let current = new Date(start);
  while (current < end) {
    buckets.push(new Date(current));
    current = addDays(current, 1);
  }
  return buckets;
}

export function formatDateLabel(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone });
}

export function formatCurrency(amount: number, currencyCode?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode ?? 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
