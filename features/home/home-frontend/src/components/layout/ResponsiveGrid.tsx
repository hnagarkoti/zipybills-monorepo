import React from 'react';
import { View, useWindowDimensions } from 'react-native';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  gap?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}

const DEFAULT_COLUMNS = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 };
const BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 };

function getColumnsForWidth(
  width: number,
  cols: Required<NonNullable<ResponsiveGridProps['columns']>>,
): number {
  if (width >= BREAKPOINTS.xl) return cols.xl;
  if (width >= BREAKPOINTS.lg) return cols.lg;
  if (width >= BREAKPOINTS.md) return cols.md;
  if (width >= BREAKPOINTS.sm) return cols.sm;
  return cols.xs;
}

export function ResponsiveGrid({ children, gap = 16, columns: columnsProp }: ResponsiveGridProps) {
  const { width } = useWindowDimensions();
  const cols = { ...DEFAULT_COLUMNS, ...columnsProp };
  const numColumns = getColumnsForWidth(width, cols);
  const childArray = React.Children.toArray(children);
  const itemWidthPercent = 100 / numColumns;

  return (
    <View className="flex-row flex-wrap" style={{ margin: -(gap / 2) }}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{ width: `${itemWidthPercent}%` as unknown as number, padding: gap / 2 }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
