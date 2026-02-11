/**
 * MonthCalendar – Full month grid calendar for date selection
 *
 * Shows a traditional month grid with week headers.
 * Supports navigation between months, highlights today and selected date.
 * Dot indicators show which dates have data.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export interface MonthCalendarProps {
  /** Currently selected date in YYYY-MM-DD format */
  selectedDate: string;
  /** Called when user taps a date */
  onDateSelect: (date: string) => void;
  /** Optional: dates that have data (shown with a dot indicator) */
  datesWithData?: string[];
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MonthCalendar({
  selectedDate,
  onDateSelect,
  datesWithData,
}: MonthCalendarProps) {
  const selectedD = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(selectedD.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedD.getMonth());

  const today = toDateStr(new Date());

  const weeks = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: string; day: number; inMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      cells.push({ date: toDateStr(d), day: daysInPrevMonth - i, inMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      cells.push({ date: toDateStr(dt), day: d, inMonth: true });
    }
    // Next month fill
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const dt = new Date(viewYear, viewMonth + 1, d);
        cells.push({ date: toDateStr(dt), day: d, inMonth: false });
      }
    }

    // Split into weeks
    const result: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else { setViewMonth(viewMonth - 1); }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else { setViewMonth(viewMonth + 1); }
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onDateSelect(today);
  };

  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header with month/year and navigation */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={goToPrevMonth} className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
          <ChevronLeft size={16} color="#374151" />
        </Pressable>
        <Pressable onPress={goToToday}>
          <Text className="text-base font-bold text-gray-900">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
        </Pressable>
        <Pressable onPress={goToNextMonth} className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
          <ChevronRight size={16} color="#374151" />
        </Pressable>
      </View>

      {/* Day of week headers */}
      <View className="flex-row mb-1">
        {DAY_HEADERS.map((day) => (
          <View key={day} className="flex-1 items-center py-1">
            <Text className="text-xs font-medium text-gray-400">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const hasData = datesWithData?.includes(cell.date);

            return (
              <Pressable
                key={cell.date}
                onPress={() => onDateSelect(cell.date)}
                className={`flex-1 items-center py-1.5 mx-0.5 my-0.5 rounded-lg ${
                  isSelected
                    ? 'bg-emerald-500'
                    : isToday
                      ? 'bg-emerald-50 border border-emerald-200'
                      : ''
                }`}
              >
                <Text
                  className={`text-sm ${
                    isSelected
                      ? 'text-white font-bold'
                      : isToday
                        ? 'text-emerald-700 font-bold'
                        : cell.inMonth
                          ? 'text-gray-800'
                          : 'text-gray-300'
                  }`}
                >
                  {cell.day}
                </Text>
                {hasData && (
                  <View className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
