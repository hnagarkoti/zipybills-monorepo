/**
 * CalendarStrip – Horizontal scrollable week/date selector
 *
 * Shows a row of dates centered on the selected date.
 * Tapping a date selects it. Today is highlighted.
 * On desktop the dates stretch to fill the full container width.
 * On mobile it stays as a compact scrollable strip.
 */
import React, { useMemo, useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSemanticColors } from '@zipybills/theme-engine';

export interface CalendarStripProps {
  /** Currently selected date in YYYY-MM-DD format */
  selectedDate: string;
  /** Called when user taps a date */
  onDateSelect: (date: string) => void;
  /** Number of days to show before and after selected date on mobile (default: 3) */
  range?: number;
  /** Optional: dates that have data (shown with a dot indicator) */
  datesWithData?: string[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function CalendarStrip({
  selectedDate,
  onDateSelect,
  range = 3,
  datesWithData,
}: CalendarStripProps) {
  const sc = useSemanticColors();
  const today = toDateStr(new Date());
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const availableWidth = containerWidth || screenWidth;
  const isDesktop = availableWidth > 768;

  // Desktop: show a full week (Mon-Sun) that contains the selected date
  // plus the adjacent week on each side = 21 days, or fit to container
  // We calculate how many days fit at ~52px per cell (flex-1 will handle the rest)
  const desktopDayCount = useMemo(() => {
    if (!isDesktop) return 0;
    // Each day cell is ~52px min. Fill the entire row.
    const fitCount = Math.floor(availableWidth / 52);
    // Use an odd number so selected date can be centered
    return fitCount % 2 === 0 ? fitCount - 1 : fitCount;
  }, [isDesktop, availableWidth]);

  // Generate date array
  const dates = useMemo(() => {
    const center = new Date(selectedDate + 'T00:00:00');
    const half = isDesktop ? Math.floor(desktopDayCount / 2) : range;
    const result: Date[] = [];
    for (let i = -half; i <= half; i++) {
      const d = new Date(center);
      d.setDate(center.getDate() + i);
      result.push(d);
    }
    return result;
  }, [selectedDate, isDesktop, desktopDayCount, range]);

  const selectedMonth = new Date(selectedDate + 'T00:00:00');
  const monthLabel = `${MONTH_NAMES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;

  const goBack = useCallback(() => {
    const step = isDesktop ? desktopDayCount : (range * 2 + 1);
    onDateSelect(addDays(selectedDate, -step));
  }, [selectedDate, isDesktop, desktopDayCount, range, onDateSelect]);

  const goForward = useCallback(() => {
    const step = isDesktop ? desktopDayCount : (range * 2 + 1);
    onDateSelect(addDays(selectedDate, step));
  }, [selectedDate, isDesktop, desktopDayCount, range, onDateSelect]);

  const renderDateCell = (d: Date) => {
    const dateStr = toDateStr(d);
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === today;
    const hasData = datesWithData?.includes(dateStr);
    const dayName = DAY_NAMES[d.getDay()];
    const dayNum = d.getDate();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    return (
      <Pressable
        key={dateStr}
        onPress={() => onDateSelect(dateStr)}
        className={`items-center justify-center rounded-xl py-2 ${
          isDesktop ? 'flex-1 mx-px min-w-0' : 'mx-1 px-2.5 min-w-[48px]'
        } ${
          isSelected
            ? 'bg-emerald-500'
            : isToday
              ? 'bg-emerald-50 border border-emerald-200'
              : isWeekend
                ? 'bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                : 'bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-700'
        }`}
      >
        <Text
          className={`text-xs ${
            isSelected ? 'text-emerald-100' : isToday ? 'text-emerald-600' : isWeekend ? 'text-gray-400' : 'text-gray-400'
          }`}
        >
          {dayName}
        </Text>
        <Text
          className={`text-lg font-bold mt-0.5 ${
            isSelected ? 'text-white' : isToday ? 'text-emerald-700' : isWeekend ? 'text-gray-400' : 'text-gray-800'
          }`}
        >
          {dayNum}
        </Text>
        {hasData && !isSelected && (
          <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
        )}
        {hasData && isSelected && (
          <View className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
        )}
        {!hasData && (
          <View className="w-1.5 h-1.5 mt-0.5" />
        )}
      </Pressable>
    );
  };

  return (
    <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      {/* Header: nav arrows + month label + Today button */}
      <View className="flex-row items-center justify-between mb-2 px-1">
        <View className="flex-row items-center">
          <Pressable onPress={goBack} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-2">
            <ChevronLeft size={16} color={sc.iconDefault} />
          </Pressable>
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{monthLabel}</Text>
          <Pressable onPress={goForward} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center ml-2">
            <ChevronRight size={16} color={sc.iconDefault} />
          </Pressable>
        </View>
        {selectedDate !== today && (
          <Pressable onPress={() => onDateSelect(today)} className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-blue-600">Today</Text>
          </Pressable>
        )}
      </View>

      {/* Date strip – flex row on desktop, scrollable on mobile */}
      {isDesktop ? (
        <View className="flex-row">
          {dates.map(renderDateCell)}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {dates.map(renderDateCell)}
        </ScrollView>
      )}
    </View>
  );
}
