/**
 * CSV helpers for Production Plan bulk import/export.
 *
 * Works on both Web and React Native (no native file system dependencies).
 * Template download uses Blob + URL.createObjectURL on web.
 * CSV parsing is pure JS – no library needed.
 */
import type { CreatePlanRequest } from '@zipybills/factory-planning-service-interface';

export const CSV_HEADERS = [
  'plan_date',
  'machine_id',
  'shift_id',
  'product_name',
  'product_code',
  'target_quantity',
] as const;

export const CSV_TEMPLATE_CONTENT = [
  CSV_HEADERS.join(','),
  '# plan_date: YYYY-MM-DD format',
  '# machine_id: numeric machine ID (see Machines page)',
  '# shift_id: numeric shift ID (see Shifts page)',
  '# product_name: product name (required)',
  '# product_code: product code (optional)',
  '# target_quantity: target units to produce (required)',
  '#',
  '# Example rows:',
  '2026-02-16,1,1,Gear Shaft A-200,GS-A200,500',
  '2026-02-16,2,1,Bearing Housing B-100,BH-B100,300',
  '2026-02-17,1,2,Gear Shaft A-200,GS-A200,450',
].join('\n');

/**
 * Trigger CSV template download in web browser
 */
export function downloadCSVTemplate(): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof (globalThis as any).document === 'undefined') return;

  const csvContent = CSV_TEMPLATE_CONTENT;
  const blob = new (globalThis as any).Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = (globalThis as any).URL.createObjectURL(blob);
  const link = (globalThis as any).document.createElement('a');
  link.href = url;
  link.download = 'production_plan_template.csv';
  link.style.display = 'none';
  (globalThis as any).document.body.appendChild(link);
  link.click();
  (globalThis as any).document.body.removeChild(link);
  (globalThis as any).URL.revokeObjectURL(url);
}

/**
 * Parse a CSV string into CreatePlanRequest[]
 * Skips comment lines (starting with #) and blank lines.
 */
export function parseCSV(csvText: string): { plans: CreatePlanRequest[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const plans: CreatePlanRequest[] = [];
  const errors: string[] = [];

  // Skip header if it matches
  const startIdx = lines[0]?.toLowerCase().includes('plan_date') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());
    const [planDate, machineId, shiftId, productName, productCode, targetQty] = cols;

    if (!planDate || !machineId || !shiftId || !productName || !targetQty) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      continue;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
      errors.push(`Row ${i + 1}: Invalid date format "${planDate}" (expected YYYY-MM-DD)`);
      continue;
    }

    const target = parseInt(targetQty, 10);
    if (isNaN(target) || target <= 0) {
      errors.push(`Row ${i + 1}: Invalid target_quantity "${targetQty}"`);
      continue;
    }

    plans.push({
      plan_date: planDate,
      machine_id: parseInt(machineId, 10),
      shift_id: parseInt(shiftId, 10),
      product_name: productName,
      product_code: productCode || undefined,
      target_quantity: target,
    });
  }

  return { plans, errors };
}

/**
 * Read a File object as text (for web file input)
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
