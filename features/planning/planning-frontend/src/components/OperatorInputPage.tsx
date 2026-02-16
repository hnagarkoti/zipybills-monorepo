import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Factory,
  Clock,
  AlertTriangle,
  Target,
  Package,
  TrendingUp,
  X as XIcon,
  PenLine,
  Hash,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { fetchPlans, createProductionLog, type ProductionPlan } from '../services/api';
import { fetchShifts, type Shift } from '@zipybills/factory-shifts-frontend';
import { Alert } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';

/* ─── Constants ──────────────────────── */

const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  const next = String(i + 1).padStart(2, '0');
  return { label: `${h}:00 – ${next}:00`, value: i };
});

/** Strip anything that isn't 0-9 */
function numericOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

/* ─── Types ──────────────────────────── */

interface FormState {
  hour_slot: string;
  quantity_produced: string;
  quantity_ok: string;
  quantity_rejected: string;
  rejection_reason: string;
  notes: string;
}

interface FormErrors {
  hour_slot?: string;
  quantity_produced?: string;
  quantity_rejected?: string;
  rejection_reason?: string;
  sum?: string;
}

const EMPTY_FORM: FormState = {
  hour_slot: '',
  quantity_produced: '',
  quantity_ok: '',
  quantity_rejected: '',
  rejection_reason: '',
  notes: '',
};

/* ═══════════════════════════════════════
   Main Page — Plan List
   ═══════════════════════════════════════ */

export function OperatorInputPage() {
  const sc = useSemanticColors();
  const { guardedMutate } = useCompliance();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<ProductionPlan | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const today = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, shiftsData] = await Promise.all([
        fetchPlans({ date: today }),
        fetchShifts(),
      ]);
      setPlans(plansData.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNED'));
      setShifts(shiftsData);
      setGlobalError(null);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentShift = shifts.find((s) => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh = 0, sm = 0] = s.start_time.split(':').map(Number);
    const [eh = 0, em = 0] = s.end_time.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start < end ? current >= start && current < end : current >= start || current < end;
  });

  const handleLogSuccess = useCallback(
    (msg: string) => {
      setActivePlan(null);
      setGlobalSuccess(msg);
      loadData();
      setTimeout(() => setGlobalSuccess(null), 4000);
    },
    [loadData],
  );

  return (
    <ScrollView className="flex-1 p-4">
      {/* Header */}
      <View className="mb-5">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Operator Input
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Tap a production plan to log hourly output for {today}
        </Text>
        {currentShift && (
          <View className="mt-2 flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg self-start">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Current shift: {currentShift.shift_name}
            </Text>
          </View>
        )}
      </View>

      {globalSuccess && (
        <View className="mb-4">
          <Alert variant="success" message={globalSuccess} />
        </View>
      )}
      {globalError && (
        <View className="mb-4">
          <Alert
            variant="error"
            message={globalError}
            onDismiss={() => setGlobalError(null)}
          />
        </View>
      )}

      {/* Plan list */}
      <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">
        Active Plans ({plans.length})
      </Text>

      {loading ? (
        <Text className="text-center text-gray-400 py-8">Loading plans...</Text>
      ) : plans.length === 0 ? (
        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-4 items-center">
          <AlertTriangle size={32} color={colors.amber[500]} />
          <Text className="text-sm font-medium text-amber-700 dark:text-amber-400 mt-3">
            No active plans for today
          </Text>
          <Text className="text-xs text-amber-500 dark:text-amber-600 mt-1">
            Ask a supervisor to create a production plan first
          </Text>
        </View>
      ) : (
        <View className="gap-3 mb-4">
          {plans.map((p) => (
            <PlanCard
              key={p.plan_id}
              plan={p}
              iconColor={sc.iconDefault}
              onPress={() => setActivePlan(p)}
            />
          ))}
        </View>
      )}

      {/* Log Production Modal */}
      {activePlan && (
        <LogProductionModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSuccess={handleLogSuccess}
        />
      )}

      <View className="h-8" />
    </ScrollView>
  );
}

/* ═══════════════════════════════════════
   Plan Card
   ═══════════════════════════════════════ */

function PlanCard({
  plan,
  iconColor,
  onPress,
}: {
  plan: ProductionPlan;
  iconColor: string;
  onPress: () => void;
}) {
  const pct =
    plan.target_quantity > 0
      ? Math.round(((Number(plan.actual_quantity) || 0) / plan.target_quantity) * 100)
      : 0;
  const statusBg =
    plan.status === 'IN_PROGRESS'
      ? 'bg-blue-100 dark:bg-blue-900/30'
      : 'bg-amber-100 dark:bg-amber-900/30';
  const statusText =
    plan.status === 'IN_PROGRESS'
      ? 'text-blue-700 dark:text-blue-300'
      : 'text-amber-700 dark:text-amber-300';

  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 active:scale-[0.98]"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
            {plan.product_name}
          </Text>
          <View className="flex-row items-center mt-1 gap-3">
            <View className="flex-row items-center">
              <Factory size={12} color={iconColor} />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {plan.machine_name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={12} color={iconColor} />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {plan.shift_name}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <View className={`px-2 py-0.5 rounded-full ${statusBg}`}>
            <Text className={`text-[10px] font-semibold ${statusText}`}>
              {plan.status}
            </Text>
          </View>
          <View className="mt-2 bg-emerald-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
            <PenLine size={12} color="#fff" />
            <Text className="text-xs font-semibold text-white">Log</Text>
          </View>
        </View>
      </View>
      {/* Progress */}
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {Number(plan.actual_quantity) || 0}/{plan.target_quantity}
        </Text>
        <View className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </View>
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-10 text-right">
          {pct}%
        </Text>
      </View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════
   Log Production Modal (the form popup)
   ═══════════════════════════════════════ */

function LogProductionModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: ProductionPlan;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const { guardedMutate: guardMutation } = useCompliance();
  const currentHour = new Date().getHours();
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    hour_slot: String(currentHour),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hourScrollRef = useRef<ScrollView>(null);
  const hourScrollOffset = useRef(0);
  const CHIP_WIDTH = 130; // approx width of one hour chip + gap

  const scrollHourBy = (direction: 'left' | 'right') => {
    const step = CHIP_WIDTH * 2;
    const newOffset =
      direction === 'left'
        ? Math.max(0, hourScrollOffset.current - step)
        : hourScrollOffset.current + step;
    hourScrollRef.current?.scrollTo({ x: newOffset, animated: true });
  };

  const pct =
    plan.target_quantity > 0
      ? Math.round(((Number(plan.actual_quantity) || 0) / plan.target_quantity) * 100)
      : 0;
  const remaining = Math.max(0, plan.target_quantity - (Number(plan.actual_quantity) || 0));

  /* ─── Numeric handlers ─── */

  const handleProducedChange = (raw: string) => {
    const val = numericOnly(raw);
    const qty = parseInt(val, 10) || 0;
    const rej = parseInt(form.quantity_rejected, 10) || 0;
    setForm({ ...form, quantity_produced: val, quantity_ok: String(Math.max(0, qty - rej)) });
    setErrors((e) => ({ ...e, quantity_produced: undefined, sum: undefined }));
  };

  const handleRejectedChange = (raw: string) => {
    const val = numericOnly(raw);
    const qty = parseInt(form.quantity_produced, 10) || 0;
    const rej = parseInt(val, 10) || 0;
    setForm({ ...form, quantity_rejected: val, quantity_ok: String(Math.max(0, qty - rej)) });
    setErrors((e) => ({ ...e, quantity_rejected: undefined, sum: undefined }));
  };

  const handleOkChange = (raw: string) => {
    const val = numericOnly(raw);
    setForm({ ...form, quantity_ok: val });
    setErrors((e) => ({ ...e, sum: undefined }));
  };

  /* ─── Validation ─── */

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.hour_slot) e.hour_slot = 'Select an hour slot';
    if (!form.quantity_produced || form.quantity_produced === '0')
      e.quantity_produced = 'Produced quantity is required';

    const qty = parseInt(form.quantity_produced, 10) || 0;
    const ok = parseInt(form.quantity_ok, 10) || 0;
    const rej = parseInt(form.quantity_rejected, 10) || 0;

    if (qty > 0 && ok + rej !== qty)
      e.sum = `OK (${ok}) + Rejected (${rej}) must equal Produced (${qty})`;
    if (rej > qty) e.quantity_rejected = "Rejected can't exceed produced";
    if (rej > 0 && !form.rejection_reason.trim())
      e.rejection_reason = 'Reason required when rejections > 0';

    return e;
  };

  /* ─── Submit ─── */

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const qty = parseInt(form.quantity_produced, 10);
    const ok = parseInt(form.quantity_ok, 10) || qty;
    const rej = parseInt(form.quantity_rejected, 10) || 0;

    await guardMutation('create', async () => {
      try {
        setSubmitting(true);
        setSubmitError(null);
        await createProductionLog({
          plan_id: plan.plan_id,
          machine_id: plan.machine_id,
          shift_id: plan.shift_id,
          hour_slot: form.hour_slot,
          quantity_produced: qty,
          quantity_ok: ok,
          quantity_rejected: rej,
          rejection_reason: form.rejection_reason || undefined,
          notes: form.notes || undefined,
        });
        onSuccess(
          `Logged ${qty} units (${ok} OK, ${rej} rejected) for hour ${form.hour_slot}:00`,
        );
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit production log');
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-2xl max-h-[92%]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* ─── Plan Summary Header ─── */}
              <View className="px-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {plan.product_name}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-row items-center">
                        <Factory size={12} color={colors.blue[500]} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          {plan.machine_name || `Machine #${plan.machine_id}`}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Clock size={12} color={colors.purple[500]} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          {plan.shift_name || `Shift #${plan.shift_id}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                  >
                    <XIcon size={16} color="#9ca3af" />
                  </Pressable>
                </View>

                {/* Mini progress strip */}
                <View className="flex-row items-center gap-3 mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
                  <StatMini
                    icon={<Target size={14} color={colors.blue[500]} />}
                    value={String(plan.target_quantity)}
                    label="Target"
                  />
                  <View className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  <StatMini
                    icon={<Package size={14} color={colors.emerald[500]} />}
                    value={String(Number(plan.actual_quantity) || 0)}
                    label="Done"
                    valueColor="text-emerald-600 dark:text-emerald-400"
                  />
                  <View className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  <StatMini
                    icon={<TrendingUp size={14} color={colors.amber[500]} />}
                    value={String(remaining)}
                    label="Left"
                    valueColor="text-amber-600 dark:text-amber-400"
                  />
                  <View className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  <StatMini
                    icon={<Hash size={14} color={colors.violet[500]} />}
                    value={`${pct}%`}
                    label="Progress"
                    valueColor={
                      pct >= 100
                        ? 'text-emerald-600'
                        : pct >= 50
                          ? 'text-blue-600'
                          : 'text-amber-600'
                    }
                  />
                </View>
              </View>

              {/* ─── Form ─── */}
              <View className="px-5 py-4">
                <Text className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Log Production Entry
                </Text>

                {submitError && (
                  <View className="mb-3">
                    <Alert
                      variant="error"
                      message={submitError}
                      onDismiss={() => setSubmitError(null)}
                    />
                  </View>
                )}

                {/* Hour Slot */}
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Hour Slot <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      onPress={() => scrollHourBy('left')}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center active:bg-gray-200 dark:active:bg-gray-700"
                    >
                      <ChevronLeft size={16} color="#6b7280" />
                    </Pressable>
                    <Pressable
                      onPress={() => scrollHourBy('right')}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center active:bg-gray-200 dark:active:bg-gray-700"
                    >
                      <ChevronRight size={16} color="#6b7280" />
                    </Pressable>
                  </View>
                </View>
                <ScrollView
                  ref={hourScrollRef}
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={Platform.OS === 'web'}
                  className="mb-1"
                  onScroll={(e) => {
                    hourScrollOffset.current = e.nativeEvent.contentOffset.x;
                  }}
                  scrollEventThrottle={16}
                  onLayout={() => {
                    const offset = Math.max(0, currentHour * CHIP_WIDTH - CHIP_WIDTH);
                    hourScrollOffset.current = offset;
                    hourScrollRef.current?.scrollTo({ x: offset, animated: false });
                  }}
                >
                  <View className="flex-row gap-1.5 pb-1">
                    {HOUR_SLOTS.map((slot) => {
                      const selected = form.hour_slot === String(slot.value);
                      return (
                        <Pressable
                          key={slot.value}
                          onPress={() => {
                            setForm({ ...form, hour_slot: String(slot.value) });
                            setErrors((e) => ({ ...e, hour_slot: undefined }));
                          }}
                          className={`px-3 py-2 rounded-lg border ${
                            selected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <Text
                            className={`text-xs whitespace-nowrap ${
                              selected
                                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {slot.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {errors.hour_slot && (
                  <Text className="text-xs text-red-500 mb-2">{errors.hour_slot}</Text>
                )}

                {/* Quantity Fields */}
                <View className="flex-row gap-3 mt-3 mb-1">
                  <NumericField
                    label="Produced"
                    required
                    value={form.quantity_produced}
                    onChange={handleProducedChange}
                    error={errors.quantity_produced}
                    borderColor="border-gray-300 dark:border-gray-600"
                  />
                  <NumericField
                    label="OK"
                    value={form.quantity_ok}
                    onChange={handleOkChange}
                    borderColor="border-green-300 dark:border-green-700"
                    bgColor="bg-green-50/50 dark:bg-green-900/10"
                    textColor="text-green-700 dark:text-green-400"
                  />
                  <NumericField
                    label="Rejected"
                    value={form.quantity_rejected}
                    onChange={handleRejectedChange}
                    error={errors.quantity_rejected}
                    borderColor="border-red-300 dark:border-red-700"
                    bgColor="bg-red-50/50 dark:bg-red-900/10"
                    textColor="text-red-700 dark:text-red-400"
                  />
                </View>
                {errors.sum && (
                  <Text className="text-xs text-red-500 mb-2">{errors.sum}</Text>
                )}

                {/* Rejection Reason (shown only when rejected > 0) */}
                {(parseInt(form.quantity_rejected, 10) || 0) > 0 && (
                  <View className="mt-2 mb-3">
                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Rejection Reason <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`border rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                        errors.rejection_reason
                          ? 'border-red-400'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      value={form.rejection_reason}
                      onChangeText={(t) => {
                        setForm({ ...form, rejection_reason: t });
                        setErrors((e) => ({ ...e, rejection_reason: undefined }));
                      }}
                      placeholder="e.g., Dimension out of tolerance"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.rejection_reason && (
                      <Text className="text-xs text-red-500 mt-1">
                        {errors.rejection_reason}
                      </Text>
                    )}
                  </View>
                )}

                {/* Notes */}
                <View className="mt-2 mb-4">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Notes (optional)
                  </Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.notes}
                    onChangeText={(t) => setForm({ ...form, notes: t })}
                    placeholder="Any remarks..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Submit */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  className={`py-3.5 rounded-xl items-center ${
                    submitting
                      ? 'bg-gray-300 dark:bg-gray-700'
                      : 'bg-emerald-500 active:bg-emerald-600'
                  }`}
                >
                  <Text className="text-white font-bold text-sm">
                    {submitting ? 'Submitting...' : 'Submit Production Log'}
                  </Text>
                </Pressable>
              </View>

              <View className="h-6" />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══════════════════════════════════════
   Small reusable pieces
   ═══════════════════════════════════════ */

function StatMini({
  icon,
  value,
  label,
  valueColor = 'text-gray-900 dark:text-gray-100',
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <View className="items-center flex-1">
      {icon}
      <Text className={`text-sm font-bold mt-0.5 ${valueColor}`}>{value}</Text>
      <Text className="text-[9px] text-gray-400">{label}</Text>
    </View>
  );
}

function NumericField({
  label,
  required,
  value,
  onChange,
  error,
  borderColor = 'border-gray-300 dark:border-gray-600',
  bgColor = '',
  textColor = 'text-gray-900 dark:text-gray-100',
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <View className="flex-1">
      <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-3 py-2.5 text-sm text-center font-semibold ${
          error ? 'border-red-400' : borderColor
        } ${bgColor} ${textColor}`}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="0"
        placeholderTextColor="#9ca3af"
      />
      {error && <Text className="text-[10px] text-red-500 mt-0.5">{error}</Text>}
    </View>
  );
}
