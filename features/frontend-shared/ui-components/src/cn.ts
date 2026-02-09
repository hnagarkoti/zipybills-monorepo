/**
 * Utility for merging Tailwind/NativeWind class names.
 * shadcn-rn pattern: clsx for conditional classes.
 */
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
