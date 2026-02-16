/**
 * UserFormPage – Premium create / edit user form
 *
 * Shared by /users/add (create) and /users/:id (edit).
 * Sections: Personal Info, Security, Role & Permissions, Account Status.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft, UserPlus, UserCog, Eye, EyeOff,
  ShieldCheck, ClipboardCheck, Wrench, Check,
  CircleAlert, Info,
} from 'lucide-react-native';
import { fetchUsers, createUser, updateUser, type User } from '../services/api';
import { Alert } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';

/* ─── Types ──────────────────────────────────── */

export interface UserFormPageProps {
  /** 'create' = new user, 'edit' = update existing */
  mode: 'create' | 'edit';
  /** Required for edit mode — user ID to load */
  userId?: number;
  /** Called when user navigates back (cancel or after save) */
  onBack: () => void;
}

type Role = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

interface FormState {
  full_name: string;
  username: string;
  password: string;
  role: Role;
  is_active: boolean;
}

const INITIAL_FORM: FormState = {
  full_name: '',
  username: '',
  password: '',
  role: 'OPERATOR',
  is_active: true,
};

/* ─── Role card metadata ─────────────────────── */

interface RoleMeta {
  role: Role;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accentBg: string;
  accentBgDark: string;
  accentBorder: string;
  accentBorderDark: string;
  accentText: string;
  accentTextDark: string;
  iconColor: string;
}

const ROLE_META: RoleMeta[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    description: 'Full system access — manage users, settings, and all features',
    icon: ShieldCheck,
    accentBg: 'bg-blue-50',
    accentBgDark: 'bg-blue-900/20',
    accentBorder: 'border-blue-300',
    accentBorderDark: 'border-blue-600',
    accentText: 'text-blue-700',
    accentTextDark: 'text-blue-400',
    iconColor: '#2563eb',
  },
  {
    role: 'SUPERVISOR',
    label: 'Supervisor',
    description: 'Manage teams, shifts & production workflows',
    icon: ClipboardCheck,
    accentBg: 'bg-amber-50',
    accentBgDark: 'bg-amber-900/20',
    accentBorder: 'border-amber-300',
    accentBorderDark: 'border-amber-600',
    accentText: 'text-amber-700',
    accentTextDark: 'text-amber-400',
    iconColor: '#d97706',
  },
  {
    role: 'OPERATOR',
    label: 'Operator',
    description: 'Production floor — log output, record downtime',
    icon: Wrench,
    accentBg: 'bg-emerald-50',
    accentBgDark: 'bg-emerald-900/20',
    accentBorder: 'border-emerald-300',
    accentBorderDark: 'border-emerald-600',
    accentText: 'text-emerald-700',
    accentTextDark: 'text-emerald-400',
    iconColor: '#059669',
  },
];

/* ─── Password strength helper ───────────────── */

type Strength = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(pw: string): { label: string; strength: Strength; pct: number } {
  if (!pw) return { label: '', strength: 'weak', pct: 0 };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Weak', strength: 'weak', pct: 20 };
  if (score === 2) return { label: 'Fair', strength: 'fair', pct: 45 };
  if (score === 3) return { label: 'Good', strength: 'good', pct: 70 };
  return { label: 'Strong', strength: 'strong', pct: 100 };
}

const STRENGTH_COLOR: Record<Strength, string> = {
  weak: '#ef4444',
  fair: '#f59e0b',
  good: '#3b82f6',
  strong: '#10b981',
};

/* ─── Component ──────────────────────────────── */

export function UserFormPage({ mode, userId, onBack }: UserFormPageProps) {
  const sc = useSemanticColors();
  const isEdit = mode === 'edit';

  /* State */
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  /* Load user data for edit mode */
  useEffect(() => {
    if (!isEdit || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const users = await fetchUsers();
        const target = users.find((u) => u.user_id === userId);
        if (cancelled) return;
        if (!target) { setError('User not found'); setLoading(false); return; }
        setOriginalUser(target);
        setForm({
          full_name: target.full_name,
          username: target.username,
          password: '',
          role: target.role,
          is_active: target.is_active,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isEdit, userId]);

  /* Derived */
  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  /* Field-level validation */
  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!isEdit && !form.password) errs.password = 'Password is required for new users';
    if (form.password && form.password.length < 4) errs.password = 'Password must be at least 4 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, isEdit]);

  /* Save handler */
  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      if (isEdit && userId) {
        const payload: Record<string, unknown> = {
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active,
        };
        if (form.password) payload.password = form.password;
        await updateUser(userId, payload);
      } else {
        await createUser({
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        });
      }
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  /* Input helper */
  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  /* ─── Loading state ──────────────────────── */
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.emerald[500]} />
        <Text className="text-sm text-gray-400 mt-3">Loading user details…</Text>
      </View>
    );
  }

  /* ─── Render ─────────────────────────────── */
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10 max-w-2xl w-full self-center"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Back button ── */}
        <Pressable
          onPress={onBack}
          className="flex-row items-center mb-5 self-start"
          hitSlop={12}
        >
          <ArrowLeft size={18} color={colors.emerald[600]} />
          <Text className="text-sm font-medium text-emerald-600 dark:text-emerald-400 ml-1.5">
            Back to Users
          </Text>
        </Pressable>

        {/* ── Header banner ── */}
        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-4">
            {isEdit
              ? <UserCog size={22} color={colors.emerald[600]} />
              : <UserPlus size={22} color={colors.emerald[600]} />}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {isEdit ? 'Edit User' : 'Create New User'}
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {isEdit
                ? `Update ${originalUser?.full_name ?? 'user'}'s profile and permissions`
                : 'Set up a new team member account'}
            </Text>
          </View>
        </View>

        {/* ── Error banner ── */}
        {error && (
          <View className="mb-4">
            <Alert variant="error" message={error} onDismiss={() => setError(null)} />
          </View>
        )}

        {/* ━━━ Section 1: Personal Information ━━━ */}
        <SectionHeader label="Personal Information" />

        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          {/* Full Name */}
          <FormField
            label="Full Name"
            required
            error={fieldErrors.full_name}
            placeholder="e.g. Rajesh Kumar"
            value={form.full_name}
            onChangeText={(t) => updateField('full_name', t)}
            autoCapitalize="words"
          />

          {/* Username */}
          <FormField
            label="Username"
            required
            error={fieldErrors.username}
            placeholder="e.g. rajesh.kumar"
            value={form.username}
            onChangeText={(t) => updateField('username', t)}
            autoCapitalize="none"
            editable={!isEdit}
            hint={isEdit ? 'Username cannot be changed after creation' : undefined}
          />
        </View>

        {/* ━━━ Section 2: Security ━━━ */}
        <SectionHeader label="Security" />

        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          {/* Password with toggle */}
          <View className="mb-1">
            <View className="flex-row items-center mb-1.5">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {isEdit ? 'New Password' : 'Password'}
              </Text>
              {!isEdit && <Text className="text-xs text-red-500 ml-0.5">*</Text>}
            </View>

            <View className="flex-row items-center border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/60 overflow-hidden">
              <TextInput
                className="flex-1 px-3.5 py-3 text-sm text-gray-900 dark:text-gray-100"
                value={form.password}
                onChangeText={(t) => updateField('password', t)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Enter a secure password'}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="px-3 py-3"
                hitSlop={8}
              >
                {showPassword
                  ? <EyeOff size={18} color="#9ca3af" />
                  : <Eye size={18} color="#9ca3af" />}
              </Pressable>
            </View>

            {fieldErrors.password && (
              <View className="flex-row items-center mt-1.5">
                <CircleAlert size={12} color="#ef4444" />
                <Text className="text-xs text-red-500 ml-1">{fieldErrors.password}</Text>
              </View>
            )}

            {/* Strength indicator */}
            {form.password.length > 0 && (
              <View className="mt-2.5">
                <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${pwStrength.pct}%`,
                      backgroundColor: STRENGTH_COLOR[pwStrength.strength],
                    }}
                  />
                </View>
                <Text
                  className="text-xs mt-1 font-medium"
                  style={{ color: STRENGTH_COLOR[pwStrength.strength] }}
                >
                  {pwStrength.label}
                  {pwStrength.strength === 'weak' && ' — use 8+ chars with mixed case & numbers'}
                  {pwStrength.strength === 'fair' && ' — add uppercase or special characters'}
                </Text>
              </View>
            )}

            {isEdit && (
              <View className="flex-row items-start mt-2">
                <Info size={12} color="#9ca3af" style={{ marginTop: 1 }} />
                <Text className="text-xs text-gray-400 ml-1.5">
                  Only fill this if you want to reset the user's password
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ━━━ Section 3: Role & Permissions ━━━ */}
        <SectionHeader label="Role & Permissions" />

        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          <Text className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Choose the access level for this user
          </Text>

          <View className="gap-3">
            {ROLE_META.map((meta) => {
              const isSelected = form.role === meta.role;
              const Icon = meta.icon;

              return (
                <Pressable
                  key={meta.role}
                  onPress={() => updateField('role', meta.role)}
                  className={`rounded-xl border-2 p-4 flex-row items-center ${
                    isSelected
                      ? `${meta.accentBg} dark:${meta.accentBgDark} ${meta.accentBorder} dark:${meta.accentBorderDark}`
                      : 'border-gray-150 dark:border-gray-750 bg-gray-50 dark:bg-gray-800/40'
                  }`}
                  style={!isSelected ? { borderColor: sc.border ?? '#e5e7eb' } : undefined}
                >
                  {/* Icon circle */}
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center mr-3.5 ${
                      isSelected ? `${meta.accentBg} dark:${meta.accentBgDark}` : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} color={isSelected ? meta.iconColor : '#9ca3af'} />
                  </View>

                  {/* Text content */}
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-bold ${
                        isSelected
                          ? `${meta.accentText} dark:${meta.accentTextDark}`
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {meta.label}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-4">
                      {meta.description}
                    </Text>
                  </View>

                  {/* Checkmark */}
                  {isSelected && (
                    <View className="w-6 h-6 rounded-full items-center justify-center ml-2"
                      style={{ backgroundColor: meta.iconColor }}
                    >
                      <Check size={14} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ━━━ Section 4: Account Status (edit only show, create always active) ━━━ */}
        {isEdit && (
          <>
            <SectionHeader label="Account Status" />

            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
              <Pressable
                onPress={() => updateField('is_active', !form.is_active)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-1 mr-4">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Text>
                  <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {form.is_active
                      ? 'User can log in and access the system'
                      : 'User is blocked from logging in'}
                  </Text>
                </View>

                {/* Toggle */}
                <View
                  className={`w-12 h-7 rounded-full justify-center ${
                    form.is_active ? 'bg-emerald-500 items-end' : 'bg-gray-300 dark:bg-gray-600 items-start'
                  }`}
                >
                  <View className="w-5.5 h-5.5 bg-white rounded-full m-0.5 shadow-sm"
                    style={{ width: 22, height: 22 }}
                  />
                </View>
              </Pressable>
            </View>
          </>
        )}

        {/* ━━━ Action Buttons ━━━ */}
        <View className="flex-row gap-3 mt-2 mb-6">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row ${
              saving ? 'bg-emerald-400' : 'bg-emerald-500'
            }`}
          >
            {saving && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
            <Text className="text-white font-bold text-base">
              {saving
                ? (isEdit ? 'Updating…' : 'Creating…')
                : (isEdit ? 'Update User' : 'Create User')}
            </Text>
          </Pressable>

          <Pressable
            onPress={onBack}
            className="px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <Text className="text-gray-600 dark:text-gray-400 font-semibold text-base">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Reusable sub-components ────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <View className="w-1 h-4 bg-emerald-500 rounded-full mr-2" />
      <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  editable?: boolean;
}

function FormField({
  label, required, error, hint, placeholder, value,
  onChangeText, autoCapitalize, editable = true,
}: FormFieldProps) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </Text>
        {required && <Text className="text-xs text-red-500 ml-0.5">*</Text>}
      </View>

      <TextInput
        className={`border rounded-xl px-3.5 py-3 text-sm ${
          error
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60'
        } ${!editable ? 'opacity-60' : ''} text-gray-900 dark:text-gray-100`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
      />

      {error && (
        <View className="flex-row items-center mt-1.5">
          <CircleAlert size={12} color="#ef4444" />
          <Text className="text-xs text-red-500 ml-1">{error}</Text>
        </View>
      )}

      {hint && !error && (
        <View className="flex-row items-start mt-1.5">
          <Info size={12} color="#9ca3af" style={{ marginTop: 1 }} />
          <Text className="text-xs text-gray-400 ml-1.5">{hint}</Text>
        </View>
      )}
    </View>
  );
}
