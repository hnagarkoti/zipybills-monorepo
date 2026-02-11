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
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] ?? '');
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
    if (!form.machine_id || !form.shift_id || !form.product_name || !form.target_quantity) {
      setError('All fields required');
      return;
    }
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
      setSuccess('Plan created successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    }
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
  };

  /* ─── Status Change ─────────────────────────── */
  const handleStatusChange = async (planId: number, status: string) => {
    try {
      await updatePlanStatus(planId, status);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  /* ─── Duplicate Plans ───────────────────────── */
  const handleDuplicate = async () => {
    if (!duplicateTarget) {
      setError('Please enter a target date');
      return;
    }
    try {
      const result = await duplicatePlans(selectedDate, duplicateTarget);
      setSuccess(`Duplicated ${result.created} plans to ${result.target_date}`);
      setShowDuplicate(false);
      setDuplicateTarget('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate plans');
    }
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
        title="Production Planning"
        subtitle={`${plans.length} plan${plans.length !== 1 ? 's' : ''} for ${selectedDate}`}
        actions={
          <View className="flex-row gap-2">
            <Pressable
              onPress={downloadCSVTemplate}
              className="bg-gray-100 px-3 py-2.5 rounded-lg flex-row items-center"
            >
              <Download size={14} color="#374151" />
              <Text className="text-gray-700 font-medium text-sm ml-1.5">Template</Text>
            </Pressable>
            <Pressable
              onPress={() => { setShowImport(!showImport); setShowForm(false); setShowDuplicate(false); }}
              className="bg-blue-50 px-3 py-2.5 rounded-lg flex-row items-center"
            >
              <Upload size={14} color="#2563eb" />
              <Text className="text-blue-700 font-medium text-sm ml-1.5">Import</Text>
            </Pressable>
            {plans.length > 0 && (
              <Pressable
                onPress={() => { setShowDuplicate(!showDuplicate); setShowForm(false); setShowImport(false); }}
                className="bg-purple-50 px-3 py-2.5 rounded-lg flex-row items-center"
              >
                <Copy size={14} color="#7c3aed" />
                <Text className="text-purple-700 font-medium text-sm ml-1.5">Duplicate</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { setShowForm(!showForm); setShowImport(false); setShowDuplicate(false); }}
              className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center"
            >
              <Plus size={14} color="#fff" />
              <Text className="text-white font-medium text-sm ml-1">New Plan</Text>
            </Pressable>
          </View>
        }
      />

      {/* Calendar View Toggle */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row bg-gray-100 rounded-lg p-0.5">
          <Pressable
            onPress={() => setCalendarView('strip')}
            className={`flex-row items-center px-3 py-1.5 rounded-md ${calendarView === 'strip' ? 'bg-white shadow-sm' : ''}`}
          >
            <Calendar size={14} color={calendarView === 'strip' ? '#059669' : '#6b7280'} />
            <Text className={`text-xs font-medium ml-1.5 ${calendarView === 'strip' ? 'text-emerald-700' : 'text-gray-500'}`}>
              Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCalendarView('month')}
            className={`flex-row items-center px-3 py-1.5 rounded-md ${calendarView === 'month' ? 'bg-white shadow-sm' : ''}`}
          >
            <CalendarDays size={14} color={calendarView === 'month' ? '#059669' : '#6b7280'} />
            <Text className={`text-xs font-medium ml-1.5 ${calendarView === 'month' ? 'text-emerald-700' : 'text-gray-500'}`}>
              Month
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
          <View className="flex-1"><StatCard label="Target" value={totalTarget} color="blue" /></View>
          <View className="flex-1"><StatCard label="Produced" value={totalProduced} subtitle={`${efficiency}% efficiency`} color="green" /></View>
          <View className="flex-1"><StatCard label="Rejected" value={totalRejected} subtitle={totalProduced > 0 ? `${Math.round((totalRejected / totalProduced) * 100)}% rate` : ''} color="red" /></View>
        </View>
      )}

      {/* Alerts */}
      {success && (<View className="mb-4"><Alert variant="success" message={success} onDismiss={() => setSuccess(null)} /></View>)}
      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}

      {/* ─── Duplicate Panel ──────────────────────── */}
      {showDuplicate && (
        <View className="bg-purple-50 rounded-xl border border-purple-200 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Copy size={18} color="#7c3aed" />
              <Text className="text-lg font-semibold text-purple-900 ml-2">Duplicate Plans</Text>
            </View>
            <Pressable onPress={() => setShowDuplicate(false)}>
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-purple-700 mb-3">
            Copy all {plans.length} plan{plans.length !== 1 ? 's' : ''} from {selectedDate} to another date.
          </Text>
          <View className="flex-row gap-2 mb-3">
            {/* Quick target buttons */}
            {[1, 7].map((offset) => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + offset);
              const ds = d.toISOString().split('T')[0] ?? '';
              return (
                <Pressable key={offset} onPress={() => setDuplicateTarget(ds)} className={`flex-1 py-2 rounded-lg border items-center ${duplicateTarget === ds ? 'bg-purple-100 border-purple-400' : 'bg-white border-purple-200'}`}>
                  <Text className="text-xs font-medium text-purple-700">{offset === 1 ? 'Next Day' : 'Next Week'}</Text>
                  <Text className="text-xs text-purple-500">{ds}</Text>
                </Pressable>
              );
            })}
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Or enter a custom target date</Text>
            <TextInput
              className="border border-purple-300 rounded-lg px-3 py-2.5 text-sm bg-white"
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
        <View className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Upload size={18} color="#2563eb" />
              <Text className="text-lg font-semibold text-blue-900 ml-2">Import Plans from CSV</Text>
            </View>
            <Pressable onPress={() => { setShowImport(false); setImportData(null); setImportErrors([]); }}>
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>

          <Text className="text-sm text-blue-700 mb-3">
            Upload a CSV file with production plans. Download the template first to see the expected format.
          </Text>

          {/* Step indicators */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-lg p-3 border border-blue-100">
              <Text className="text-xs font-bold text-blue-600 mb-1">Step 1</Text>
              <Text className="text-xs text-gray-600">Download the CSV template</Text>
              <Pressable onPress={downloadCSVTemplate} className="bg-blue-100 px-3 py-1.5 rounded-md mt-2 items-center">
                <Text className="text-xs font-medium text-blue-700">Download Template</Text>
              </Pressable>
            </View>
            <View className="flex-1 bg-white rounded-lg p-3 border border-blue-100">
              <Text className="text-xs font-bold text-blue-600 mb-1">Step 2</Text>
              <Text className="text-xs text-gray-600">Fill in your plan data</Text>
            </View>
            <View className="flex-1 bg-white rounded-lg p-3 border border-blue-100">
              <Text className="text-xs font-bold text-blue-600 mb-1">Step 3</Text>
              <Text className="text-xs text-gray-600">Upload & import</Text>
            </View>
          </View>

          {/* File Upload (Web only) */}
          {Platform.OS === 'web' ? (
            <View>
              <Pressable
                onPress={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-6 items-center mb-3"
              >
                <Upload size={28} color="#2563eb" />
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
            <View className="bg-white border border-blue-200 rounded-xl p-4 items-center mb-3">
              <Text className="text-sm text-gray-500">CSV upload is available on the web version</Text>
            </View>
          )}

          {/* Import Preview */}
          {importData && importData.length > 0 && (
            <View className="bg-white rounded-lg border border-blue-100 p-3 mb-3">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                Preview: {importData.length} plan{importData.length !== 1 ? 's' : ''} ready to import
              </Text>
              <View className="bg-gray-50 rounded-md p-2 mb-2">
                <View className="flex-row border-b border-gray-200 pb-1 mb-1">
                  <Text className="flex-1 text-xs font-bold text-gray-500">Date</Text>
                  <Text className="flex-1 text-xs font-bold text-gray-500">Product</Text>
                  <Text className="w-16 text-xs font-bold text-gray-500 text-right">Target</Text>
                </View>
                {importData.slice(0, 10).map((p, i) => (
                  <View key={i} className="flex-row py-0.5">
                    <Text className="flex-1 text-xs text-gray-600">{p.plan_date}</Text>
                    <Text className="flex-1 text-xs text-gray-800">{p.product_name}</Text>
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
                className={`py-3 rounded-lg items-center ${importing ? 'bg-gray-300' : 'bg-emerald-500'}`}
              >
                <Text className="text-white font-semibold">
                  {importing ? 'Importing...' : `Import ${importData.length} Plans`}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3">
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
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Create Plan for {selectedDate}</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-xs text-gray-500 mb-1">Machine *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {machines.map((m) => (
              <Pressable key={m.machine_id} onPress={() => setForm({ ...form, machine_id: String(m.machine_id) })} className={`px-3 py-2 rounded-lg border ${form.machine_id === String(m.machine_id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                <Text className={`text-sm ${form.machine_id === String(m.machine_id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>{m.machine_name}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mb-1">Shift *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {shifts.map((s) => (
              <Pressable key={s.shift_id} onPress={() => setForm({ ...form, shift_id: String(s.shift_id) })} className={`px-3 py-2 rounded-lg border ${form.shift_id === String(s.shift_id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                <Text className={`text-sm ${form.shift_id === String(s.shift_id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>{s.shift_name} ({s.start_time}–{s.end_time})</Text>
              </Pressable>
            ))}
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Product Name *</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.product_name} onChangeText={(t) => setForm({ ...form, product_name: t })} placeholder="e.g., Gear Shaft A-200" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Product Code</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.product_code} onChangeText={(t) => setForm({ ...form, product_code: t })} placeholder="e.g., GS-A200" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Target Quantity *</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.target_quantity} onChangeText={(t) => setForm({ ...form, target_quantity: t })} placeholder="e.g., 500" keyboardType="numeric" />
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={handleCreate} className="bg-emerald-500 px-6 py-2.5 rounded-lg flex-1 items-center">
              <Text className="text-white font-medium">Create Plan</Text>
            </Pressable>
            <Pressable onPress={() => setShowForm(false)} className="bg-gray-200 px-6 py-2.5 rounded-lg">
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ─── Plans List ───────────────────────────── */}
      {loading ? (
        <View className="items-center py-12">
          <Text className="text-center text-gray-400">Loading plans...</Text>
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} color="#9ca3af" />}
          title="No plans for this date"
          description="Create a plan manually or import from a CSV template"
        />
      ) : (
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-600">
              {plans.length} Plan{plans.length !== 1 ? 's' : ''}
            </Text>
            <Text className="text-xs text-gray-400">
              {plans.filter((p) => p.status === 'COMPLETED').length} completed
            </Text>
          </View>

          {plans.map((p) => {
            const pct = p.target_quantity > 0
              ? Math.round(((Number(p.actual_quantity) || 0) / p.target_quantity) * 100)
              : 0;
            const rejected = Number(p.actual_rejected) || 0;

            return (
              <View key={p.plan_id} className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
                {/* Top row: product + status */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-gray-900">{p.product_name}</Text>
                    {p.product_code && <Text className="text-xs text-gray-400 mt-0.5">{p.product_code}</Text>}
                  </View>
                  <PlanStatusBadge status={p.status} />
                </View>

                {/* Machine + Shift info */}
                <View className="flex-row mb-3 items-center">
                  <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1 mr-2">
                    <Factory size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-1">{p.machine_name}</Text>
                  </View>
                  <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1">
                    <Clock size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-1">{p.shift_name}</Text>
                  </View>
                </View>

                {/* Progress */}
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm font-medium text-gray-800 mr-2 w-20">
                    {p.actual_quantity || 0} / {p.target_quantity}
                  </Text>
                  <View className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${pct >= 90 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </View>
                  <Text className="text-xs font-bold text-gray-500 ml-2 w-10 text-right">{pct}%</Text>
                </View>

                {/* Rejection warning */}
                {rejected > 0 && (
                  <View className="flex-row items-center mb-2 bg-red-50 rounded-md px-2 py-1">
                    <AlertTriangle size={10} color="#ef4444" />
                    <Text className="text-xs text-red-600 ml-1 font-medium">{rejected} rejected</Text>
                  </View>
                )}

                {/* Actions */}
                {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                  <View className="flex-row gap-2 pt-2 border-t border-gray-50">
                    {p.status === 'PLANNED' && (
                      <Pressable onPress={() => handleStatusChange(p.plan_id, 'IN_PROGRESS')} className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                        <Text className="text-xs text-yellow-700 font-medium">▶ Start</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => handleStatusChange(p.plan_id, 'COMPLETED')} className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-green-700 font-medium">✓ Complete</Text>
                    </Pressable>
                    <Pressable onPress={() => handleStatusChange(p.plan_id, 'CANCELLED')} className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-red-700 font-medium">✕ Cancel</Text>
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
