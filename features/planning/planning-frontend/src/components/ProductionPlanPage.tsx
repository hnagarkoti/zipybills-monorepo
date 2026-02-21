import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import {
  ClipboardList, Factory, Clock, AlertTriangle, Plus,
  Download, Upload, Calendar, CalendarDays, X, Copy,
} from 'lucide-react-native';
import { fetchPlans, createPlan, bulkCreatePlans, duplicatePlans, updatePlanStatus, type ProductionPlan } from '../services/api';
import type { CreatePlanRequest } from '@zipybills/factory-planning-service-interface';
import { fetchMachines, type Machine } from '@zipybills/factory-machines-frontend';
import { fetchShifts, type Shift } from '@zipybills/factory-shifts-frontend';
import {
  Badge, Alert, EmptyState, PageHeader, StatCard,
  CalendarStrip, MonthCalendar,
} from '@zipybills/ui-components';
import { colors, statusColors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';
import { downloadCSVTemplate, parseCSV, readFileAsText } from '../utils/csv-helpers';

/* ─── Helpers ─────────────────────────────────── */

function PlanStatusBadge({ status }: { status: string }) {
  const variant = status === 'COMPLETED' ? 'success' as const
    : status === 'IN_PROGRESS' ? 'warning' as const
    : status === 'CANCELLED' ? 'error' as const
    : 'info' as const;
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
}

type CalendarView = 'strip' | 'month';

/* ─── Main Page ───────────────────────────────── */

export function ProductionPlanPage() {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate, guard } = useCompliance();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI state
  const [calendarView, setCalendarView] = useState<CalendarView>('strip');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState('');
  const [form, setForm] = useState({ machine_id: '', shift_id: '', product_name: '', product_code: '', target_quantity: '' });

  // Import state
  const [importData, setImportData] = useState<CreatePlanRequest[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, machinesData, shiftsData] = await Promise.all([
        fetchPlans({ date: selectedDate }), fetchMachines(), fetchShifts(),
      ]);
      setPlans(plansData);
      setMachines(machinesData.filter((m) => m.status === 'ACTIVE'));
      setShifts(shiftsData.filter((s) => s.is_active));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Single Create ─────────────────────────── */
  const handleCreate = async () => {
    const missing: string[] = [];
    if (!form.machine_id) missing.push('Machine');
    if (!form.shift_id) missing.push('Shift');
    if (!form.product_name) missing.push('Product Name');
    if (!form.target_quantity) missing.push('Target Quantity');
    if (missing.length > 0) {
      setError(`Required fields missing: ${missing.join(', ')}`);
      return;
    }
    await guardedMutate('create', async () => {
      try {
        await createPlan({
          machine_id: parseInt(form.machine_id, 10),
          shift_id: parseInt(form.shift_id, 10),
          plan_date: selectedDate,
          product_name: form.product_name,
          product_code: form.product_code,
          target_quantity: parseInt(form.target_quantity, 10),
        });
        setShowForm(false);
        setForm({ machine_id: '', shift_id: '', product_name: '', product_code: '', target_quantity: '' });
        setSuccess(t('planning.planCreated'));
        loadData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('planning.failedToCreate'));
      }
    });
  };

  /* ─── CSV File Upload ───────────────────────── */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { plans: parsed, errors } = parseCSV(text);
      setImportData(parsed);
      setImportErrors(errors);
      if (parsed.length === 0 && errors.length === 0) {
        setImportErrors(['No valid data found in the CSV file']);
      }
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Failed to read file']);
    }
    event.target.value = '';
  };

  const handleBulkImport = async () => {
    if (!importData || importData.length === 0) return;
    await guardedMutate('create', async () => {
      try {
        setImporting(true);
        const result = await bulkCreatePlans(importData);
        setSuccess(`Successfully imported ${result.created} plans${result.errors.length > 0 ? ` (${result.errors.length} failed)` : ''}`);
        if (result.errors.length > 0) {
          setImportErrors(result.errors.map((e) => `Row ${e.row}: ${e.error}`));
        } else {
          setShowImport(false);
          setImportData(null);
          setImportErrors([]);
        }
        loadData();
        setTimeout(() => setSuccess(null), 5000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Bulk import failed');
      } finally {
        setImporting(false);
      }
    });
  };

  /* ─── Status Change ─────────────────────────── */
  const handleStatusChange = async (planId: number, status: string) => {
    await guardedMutate('edit', async () => {
      try {
        await updatePlanStatus(planId, status);
        loadData();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('planning.failedToUpdate'));
      }
    });
  };

  /* ─── Duplicate Plans ───────────────────────── */
  const handleDuplicate = async () => {
    if (!duplicateTarget) {
      setError('Please enter a target date');
      return;
    }
    await guardedMutate('create', async () => {
      try {
        const result = await duplicatePlans(selectedDate, duplicateTarget);
        setSuccess(`Duplicated ${result.created} plans to ${result.target_date}`);
        setShowDuplicate(false);
        setDuplicateTarget('');
        setTimeout(() => setSuccess(null), 4000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('planning.failedToDuplicate'));
      }
    });
  };

  /* ─── Computed ──────────────────────────────── */
  const totalTarget = plans.reduce((s, p) => s + p.target_quantity, 0);
  const totalProduced = plans.reduce((s, p) => s + (Number(p.actual_quantity) || 0), 0);
  const totalRejected = plans.reduce((s, p) => s + (Number(p.actual_rejected) || 0), 0);
  const efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

  return (
    <ScrollView className="flex-1 p-4">
      {/* Header with actions */}
      <PageHeader
        title={t('planning.title')}
        subtitle={`${plans.length} plan${plans.length !== 1 ? 's' : ''} for ${selectedDate}`}
        actions={
          <View className="flex-row gap-2">
            <Pressable
              onPress={downloadCSVTemplate}
              className="bg-gray-100 dark:bg-gray-800 px-3 py-2.5 rounded-lg flex-row items-center"
            >
              <Download size={14} color={sc.textPrimary} />
              <Text className="text-gray-700 dark:text-gray-300 font-medium text-sm ml-1.5">{t('planning.template')}</Text>
            </Pressable>
            <Pressable
              onPress={() => { setShowImport(!showImport); setShowForm(false); setShowDuplicate(false); }}
              className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2.5 rounded-lg flex-row items-center"
            >
              <Upload size={14} color={colors.blue[600]} />
              <Text className="text-blue-700 dark:text-blue-400 font-medium text-sm ml-1.5">{t('common.import')}</Text>
            </Pressable>
            {plans.length > 0 && (
              <Pressable
                onPress={() => { setShowDuplicate(!showDuplicate); setShowForm(false); setShowImport(false); }}
                className="bg-purple-50 dark:bg-purple-900/30 px-3 py-2.5 rounded-lg flex-row items-center"
              >
                <Copy size={14} color={colors.violet[600]} />
                <Text className="text-purple-700 dark:text-purple-400 font-medium text-sm ml-1.5">{t('planning.duplicate')}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (!loading && (machines.length === 0 || shifts.length === 0)) {
                  const needs = [machines.length === 0 && 'Machines', shifts.length === 0 && 'Shifts'].filter(Boolean).join(' & ');
                  setError(`Please set up ${needs} first before creating production plans.`);
                  return;
                }
                setShowForm(!showForm); setShowImport(false); setShowDuplicate(false);
              }}
              className={`px-4 py-2.5 rounded-lg flex-row items-center ${!loading && (machines.length === 0 || shifts.length === 0) ? 'bg-gray-400 dark:bg-gray-600' : 'bg-emerald-500'}`}
            >
              <Plus size={14} color={colors.white} />
              <Text className="text-white font-medium text-sm ml-1">{t('planning.newPlan')}</Text>
            </Pressable>
          </View>
        }
      />

      {/* Calendar View Toggle */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <Pressable
            onPress={() => setCalendarView('strip')}
            className={`flex-row items-center px-3 py-1.5 rounded-md ${calendarView === 'strip' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <Calendar size={14} color={calendarView === 'strip' ? colors.emerald[600] : sc.iconDefault} />
            <Text className={`text-xs font-medium ml-1.5 ${calendarView === 'strip' ? 'text-emerald-700' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('planning.week')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCalendarView('month')}
            className={`flex-row items-center px-3 py-1.5 rounded-md ${calendarView === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <CalendarDays size={14} color={calendarView === 'month' ? colors.emerald[600] : sc.iconDefault} />
            <Text className={`text-xs font-medium ml-1.5 ${calendarView === 'month' ? 'text-emerald-700' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('planning.month')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Calendar */}
      <View className="mb-4">
        {calendarView === 'strip' ? (
          <CalendarStrip
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            range={3}
          />
        ) : (
          <MonthCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}
      </View>

      {/* Summary Stats */}
      {plans.length > 0 && (
        <View className="flex-row mb-4 gap-2">
          <View className="flex-1"><StatCard label={t('planning.target')} value={totalTarget} color="blue" /></View>
          <View className="flex-1"><StatCard label={t('common.produced')} value={totalProduced} subtitle={`${efficiency}% ${t('common.efficiency')}`} color="green" /></View>
          <View className="flex-1"><StatCard label={t('common.rejected')} value={totalRejected} subtitle={totalProduced > 0 ? `${Math.round((totalRejected / totalProduced) * 100)}% rate` : ''} color="red" /></View>
        </View>
      )}

      {/* Alerts */}
      {success && (<View className="mb-4"><Alert variant="success" message={success} onDismiss={() => setSuccess(null)} /></View>)}
      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}

      {/* ─── Setup Prerequisites Guide ────────────── */}
      {!loading && (machines.length === 0 || shifts.length === 0) && (
        <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-4">
          <View className="items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mb-3">
              <ClipboardList size={28} color={colors.blue[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('planning.setupRequired')}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('planning.setupRequiredDesc')}
            </Text>
          </View>

          <View className="gap-3">
            {/* Machines status */}
            <View className={`flex-row items-center p-3 rounded-lg border ${machines.length > 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${machines.length > 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {machines.length > 0 ? (
                  <Text className="text-green-600 font-bold text-sm">{"\u2713"}</Text>
                ) : (
                  <Factory size={16} color={sc.iconMuted} />
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-medium ${machines.length > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {machines.length > 0 ? `${machines.length} ${t('planning.machinesReady')}` : t('planning.addMachines')}
                </Text>
                {machines.length === 0 && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('planning.addMachinesDesc')}</Text>
                )}
              </View>
            </View>

            {/* Shifts status */}
            <View className={`flex-row items-center p-3 rounded-lg border ${shifts.length > 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${shifts.length > 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {shifts.length > 0 ? (
                  <Text className="text-green-600 font-bold text-sm">{"\u2713"}</Text>
                ) : (
                  <Clock size={16} color={sc.iconMuted} />
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-medium ${shifts.length > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {shifts.length > 0 ? `${shifts.length} ${t('planning.shiftsReady')}` : t('planning.setupShifts')}
                </Text>
                {shifts.length === 0 && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('planning.setupShiftsDesc')}</Text>
                )}
              </View>
            </View>
          </View>

          <Text className="text-xs text-blue-600 dark:text-blue-400 text-center mt-4 font-medium">
            {t('planning.completeSteps')}
          </Text>
        </View>
      )}

      {/* ─── Duplicate Panel ──────────────────────── */}
      {showDuplicate && (
        <View className="bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Copy size={18} color={colors.violet[600]} />
              <Text className="text-lg font-semibold text-purple-900 dark:text-purple-200 ml-2">{t('planning.duplicatePlans')}</Text>
            </View>
            <Pressable onPress={() => setShowDuplicate(false)}>
              <X size={18} color={sc.iconDefault} />
            </Pressable>
          </View>
          <Text className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Copy all {plans.length} plan{plans.length !== 1 ? 's' : ''} from {selectedDate} to another date.
          </Text>
          <View className="flex-row gap-2 mb-3">
            {/* Quick target buttons */}
            {[1, 7].map((offset) => {
              const d = new Date(selectedDate + 'T00:00:00');
              d.setDate(d.getDate() + offset);
              const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return (
                <Pressable key={offset} onPress={() => setDuplicateTarget(ds)} className={`flex-1 py-2 rounded-lg border items-center ${duplicateTarget === ds ? 'bg-purple-100 dark:bg-purple-800/30 border-purple-400' : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700'}`}>
                  <Text className="text-xs font-medium text-purple-700">{offset === 1 ? t('planning.nextDay') : t('planning.nextWeek')}</Text>
                  <Text className="text-xs text-purple-500">{ds}</Text>
                </Pressable>
              );
            })}
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Or enter a custom target date</Text>
            <TextInput
              className="border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
              value={duplicateTarget}
              onChangeText={setDuplicateTarget}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <Pressable onPress={handleDuplicate} className="bg-purple-600 py-3 rounded-lg items-center">
            <Text className="text-white font-semibold">Duplicate {plans.length} Plans → {duplicateTarget || '...'}</Text>
          </Pressable>
        </View>
      )}

      {/* ─── Import Panel ─────────────────────────── */}
      {showImport && (
        <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Upload size={18} color={colors.blue[600]} />
              <Text className="text-lg font-semibold text-blue-900 dark:text-blue-200 ml-2">{t('planning.importCSV')}</Text>
            </View>
            <Pressable onPress={() => { setShowImport(false); setImportData(null); setImportErrors([]); }}>
              <X size={18} color={sc.iconDefault} />
            </Pressable>
          </View>

          <Text className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Upload a CSV file with production plans. Download the template first to see the expected format.
          </Text>

          {/* Step indicators */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Step 1</Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">Download the CSV template</Text>
              <Pressable onPress={downloadCSVTemplate} className="bg-blue-100 dark:bg-blue-800/40 px-3 py-1.5 rounded-md mt-2 items-center">
                <Text className="text-xs font-medium text-blue-700">{t('planning.downloadTemplate')}</Text>
              </Pressable>
            </View>
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Step 2</Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">Fill in your plan data</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Step 3</Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400">Upload & import</Text>
            </View>
          </View>

          {/* File Upload (Web only) */}
          {Platform.OS === 'web' ? (
            <View>
              <Pressable
                onPress={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-6 items-center mb-3"
              >
                <Upload size={28} color={colors.blue[600]} />
                <Text className="text-sm font-medium text-blue-700 mt-2">Click to select CSV file</Text>
                <Text className="text-xs text-blue-400 mt-1">or drag and drop</Text>
              </Pressable>
              {/* Hidden file input */}
              <input
                ref={fileInputRef as React.RefObject<HTMLInputElement>}
                type="file"
                accept=".csv"
                onChange={handleFileSelect as unknown as React.ChangeEventHandler<HTMLInputElement>}
                style={{ display: 'none' }}
              />
            </View>
          ) : (
            <View className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl p-4 items-center mb-3">
              <Text className="text-sm text-gray-500 dark:text-gray-400">CSV upload is available on the web version</Text>
            </View>
          )}

          {/* Import Preview */}
          {importData && importData.length > 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 p-3 mb-3">
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Preview: {importData.length} plan{importData.length !== 1 ? 's' : ''} ready to import
              </Text>
              <View className="bg-gray-50 dark:bg-gray-900 rounded-md p-2 mb-2">
                <View className="flex-row border-b border-gray-200 dark:border-gray-700 pb-1 mb-1">
                  <Text className="flex-1 text-xs font-bold text-gray-500 dark:text-gray-400">Date</Text>
                  <Text className="flex-1 text-xs font-bold text-gray-500 dark:text-gray-400">Product</Text>
                  <Text className="w-16 text-xs font-bold text-gray-500 dark:text-gray-400 text-right">Target</Text>
                </View>
                {importData.slice(0, 10).map((p, i) => (
                  <View key={i} className="flex-row py-0.5">
                    <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400">{p.plan_date}</Text>
                    <Text className="flex-1 text-xs text-gray-800 dark:text-gray-200">{p.product_name}</Text>
                    <Text className="w-16 text-xs text-gray-700 text-right font-medium">{p.target_quantity}</Text>
                  </View>
                ))}
                {importData.length > 10 && (
                  <Text className="text-xs text-gray-400 mt-1 text-center">...and {importData.length - 10} more</Text>
                )}
              </View>
              <Pressable
                onPress={handleBulkImport}
                disabled={importing}
                className={`py-3 rounded-lg items-center ${importing ? 'bg-gray-300 dark:bg-gray-700' : 'bg-emerald-500'}`}
              >
                <Text className="text-white font-semibold">
                  {importing ? 'Importing...' : `Import ${importData.length} Plans`}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <Text className="text-xs font-bold text-red-600 mb-1">Errors ({importErrors.length})</Text>
              {importErrors.slice(0, 5).map((e, i) => (
                <Text key={i} className="text-xs text-red-500">• {e}</Text>
              ))}
              {importErrors.length > 5 && (
                <Text className="text-xs text-red-400 mt-1">...and {importErrors.length - 5} more</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* ─── Create Plan Form ─────────────────────── */}
      {showForm && (
        <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('planning.createPlan')} — {selectedDate}</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <X size={18} color={sc.iconDefault} />
            </Pressable>
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('planning.machine')} *</Text>
          {machines.length === 0 ? (
            <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <Text className="text-sm text-amber-700 dark:text-amber-400 font-medium">No machines available</Text>
              <Text className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Go to the Machines page to add machines first.</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {machines.map((m) => (
                <Pressable key={m.machine_id} onPress={() => setForm({ ...form, machine_id: String(m.machine_id) })} className={`px-3 py-2 rounded-lg border ${form.machine_id === String(m.machine_id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                  <Text className={`text-sm ${form.machine_id === String(m.machine_id) ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{m.machine_name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('planning.shift')} *</Text>
          {shifts.length === 0 ? (
            <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <Text className="text-sm text-amber-700 dark:text-amber-400 font-medium">No shifts available</Text>
              <Text className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Go to the Shifts page to set up shifts first.</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {shifts.map((s) => (
                <Pressable key={s.shift_id} onPress={() => setForm({ ...form, shift_id: String(s.shift_id) })} className={`px-3 py-2 rounded-lg border ${form.shift_id === String(s.shift_id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                  <Text className={`text-sm ${form.shift_id === String(s.shift_id) ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{s.shift_name} ({s.start_time}–{s.end_time})</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('planning.productName')} *</Text>
            <TextInput className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100" value={form.product_name} onChangeText={(v) => setForm({ ...form, product_name: v })} placeholder="e.g., Gear Shaft A-200" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('planning.productCode')}</Text>
            <TextInput className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100" value={form.product_code} onChangeText={(v) => setForm({ ...form, product_code: v })} placeholder="e.g., GS-A200" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('planning.targetQuantity')} *</Text>
            <TextInput className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100" value={form.target_quantity} onChangeText={(v) => setForm({ ...form, target_quantity: v })} placeholder="e.g., 500" keyboardType="numeric" />
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={handleCreate} disabled={machines.length === 0 || shifts.length === 0} className={`px-6 py-2.5 rounded-lg flex-1 items-center ${machines.length === 0 || shifts.length === 0 ? 'bg-gray-300 dark:bg-gray-700' : 'bg-emerald-500'}`}>
              <Text className="text-white font-medium">{t('planning.createPlan')}</Text>
            </Pressable>
            <Pressable onPress={() => setShowForm(false)} className="bg-gray-200 dark:bg-gray-700 px-6 py-2.5 rounded-lg">
              <Text className="text-gray-700 dark:text-gray-300 font-medium">{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ─── Plans List ───────────────────────────── */}
      {loading ? (
        <View className="items-center py-12">
          <Text className="text-center text-gray-400">{t('planning.loadingPlans')}</Text>
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} color={sc.iconMuted} />}
          title={t('planning.noPlansForDate')}
          description={t('planning.noPlansDesc')}
        />
      ) : (
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {plans.length} Plan{plans.length !== 1 ? 's' : ''}
            </Text>
            <Text className="text-xs text-gray-400">
              {plans.filter((p) => p.status === 'COMPLETED').length} {t('planning.completed')}
            </Text>
          </View>

          {plans.map((p) => {
            const pct = p.target_quantity > 0
              ? Math.round(((Number(p.actual_quantity) || 0) / p.target_quantity) * 100)
              : 0;
            const rejected = Number(p.actual_rejected) || 0;

            return (
              <View key={p.plan_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-3 shadow-sm">
                {/* Top row: product + status */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{p.product_name}</Text>
                    {p.product_code && <Text className="text-xs text-gray-400 mt-0.5">{p.product_code}</Text>}
                  </View>
                  <PlanStatusBadge status={p.status} />
                </View>

                {/* Machine + Shift info */}
                <View className="flex-row mb-3 items-center">
                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1 mr-2">
                    <Factory size={12} color={sc.iconDefault} />
                    <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{p.machine_name}</Text>
                  </View>
                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1">
                    <Clock size={12} color={sc.iconDefault} />
                    <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{p.shift_name}</Text>
                  </View>
                </View>

                {/* Progress */}
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 mr-2 w-20">
                    {p.actual_quantity || 0} / {p.target_quantity}
                  </Text>
                  <View className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${pct >= 90 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </View>
                  <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 w-10 text-right">{pct}%</Text>
                </View>

                {/* Rejection warning */}
                {rejected > 0 && (
                  <View className="flex-row items-center mb-2 bg-red-50 dark:bg-red-900/30 rounded-md px-2 py-1">
                    <AlertTriangle size={10} color={statusColors.error} />
                    <Text className="text-xs text-red-600 ml-1 font-medium">{rejected} {t('common.rejected')}</Text>
                  </View>
                )}

                {/* Actions */}
                {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                  <View className="flex-row gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                    {p.status === 'PLANNED' && (
                      <Pressable onPress={() => handleStatusChange(p.plan_id, 'IN_PROGRESS')} className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-3 py-1.5 rounded-lg">
                        <Text className="text-xs text-yellow-700 font-medium">▶ {t('planning.start')}</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleStatusChange(p.plan_id, 'COMPLETED')} className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-green-700 font-medium">✓ {t('planning.complete')}</Text>
                    </Pressable>
                    <Pressable onPress={() => handleStatusChange(p.plan_id, 'CANCELLED')} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-red-700 font-medium">✕ {t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
