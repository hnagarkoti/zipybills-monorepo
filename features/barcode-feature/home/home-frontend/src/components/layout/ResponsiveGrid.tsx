import React from 'react';
import { View, useWindowDimensions } from 'react-native';

export interface ResponsiveGridProps {
  /** Grid items to render */
  children: React.ReactNode;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /** Override columns per breakpoint: { xs, sm, md, lg, xl } */
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const DEFAULT_COLUMNS = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
};

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

function getColumnsForWidth(
  width: number,
  columns: Required<NonNullable<ResponsiveGridProps['columns']>>,
): number {
  if (width >= BREAKPOINTS.xl) return columns.xl;
  if (width >= BREAKPOINTS.lg) return columns.lg;
  if (width >= BREAKPOINTS.md) return columns.md;
  if (width >= BREAKPOINTS.sm) return columns.sm;
  return columns.xs;
}

export function ResponsiveGrid({
  children,
  gap = 16,
  columns: columnsProp,
}: ResponsiveGridProps) {
  const { width } = useWindowDimensions();
  const cols = { ...DEFAULT_COLUMNS, ...columnsProp };
  const numColumns = getColumnsForWidth(width, cols);

  const childArray = React.Children.toArray(children);

  // Calculate item width as a percentage string for flex-basis
  const itemWidthPercent = 100 / numColumns;

  return (
    <View
      className="flex-row flex-wrap"
      style={{ margin: -(gap / 2) }}
    >
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${itemWidthPercent}%` as unknown as number,
            padding: gap / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
