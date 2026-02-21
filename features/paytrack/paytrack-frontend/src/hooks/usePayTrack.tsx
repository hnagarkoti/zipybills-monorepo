/**
 * PayTrack – Shared hooks for toast notifications and formatting
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react-native';

/* ─── Toast Hook ──────────────────────────────── */

interface ToastState {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: 'success' | 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);
    setToast({ message, type, id: Date.now() });
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 3500);
  }, [slideAnim, opacityAnim]);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [slideAnim, opacityAnim]);

  const ToastView = useCallback(() => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
      <Animated.View
        style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim, position: 'absolute', top: 8, left: 16, right: 16, zIndex: 9999 }}
        className={`rounded-xl p-3.5 shadow-lg flex-row items-center ${isSuccess ? 'bg-emerald-600' : 'bg-red-600'}`}
      >
        {isSuccess ? <CheckCircle2 size={18} color="#fff" /> : <AlertTriangle size={18} color="#fff" />}
        <Text className="text-white font-medium text-sm ml-2.5 flex-1">{toast.message}</Text>
        <Pressable onPress={dismiss} className="ml-2 p-1">
          <X size={16} color="#ffffffcc" />
        </Pressable>
      </Animated.View>
    );
  }, [toast, slideAnim, opacityAnim, dismiss]);

  return { show, ToastView };
}

/* ─── Formatting Helpers ──────────────────────── */

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Status Helpers ──────────────────────────── */

export const materialStatusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; color: string; bgClass: string }> = {
  pending:           { label: 'Pending',           variant: 'warning', color: '#d97706', bgClass: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' },
  approved:          { label: 'Approved',          variant: 'info',    color: '#2563eb', bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' },
  payment_requested: { label: 'Payment Requested', variant: 'default', color: '#7c3aed', bgClass: 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' },
  paid:              { label: 'Paid',              variant: 'success', color: '#059669', bgClass: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' },
  rejected:          { label: 'Rejected',          variant: 'error',   color: '#dc2626', bgClass: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800' },
};

export const paymentModeConfig: Record<string, { label: string; icon: string }> = {
  upi:    { label: 'UPI',    icon: '📱' },
  paytm:  { label: 'Paytm',  icon: '💳' },
  bank:   { label: 'Bank',   icon: '🏦' },
  cash:   { label: 'Cash',   icon: '💵' },
  cheque: { label: 'Cheque', icon: '📄' },
};
