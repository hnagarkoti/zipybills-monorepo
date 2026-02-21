/**
 * PayTrack Materials Page – Material entry, approval workflow, and payment tracking
 *
 * Roles:
 *   OPERATOR   → Can create material entries
 *   SUPERVISOR → Can approve, request payment, reject
 *   ADMIN      → Full access, mark as paid
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, RefreshControl,
} from 'react-native';
import {
  Package, Plus, Search, X, Eye, CheckCircle2, Ban, CreditCard,
  ArrowUpRight, Filter, ChevronDown, FileText, Building2, FolderOpen,
  AlertTriangle, Clock, Receipt, IndianRupee, Pencil, Trash2, RefreshCw,
} from 'lucide-react-native';
import { Badge, PageHeader } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';
import {
  fetchMaterials, createMaterial, updateMaterial, deleteMaterial,
  approveMaterial, requestPayment, rejectMaterial, markAsPaid,
  fetchProjects, fetchVendors, checkInvoice,
  type Material, type Project, type Vendor, type MaterialFilters,
} from '../services/api';
import { formatCurrency, formatDate, materialStatusConfig, paymentModeConfig, useToast } from '../hooks/usePayTrack';

/* ─── Material Form Modal ─────────────────────── */

interface MaterialFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  projects: Project[];
  vendors: Vendor[];
  initialData?: Partial<Material>;
  isEditing: boolean;
}

function MaterialFormModal({ visible, onClose, onSave, projects, vendors, initialData, isEditing }: MaterialFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const UNIT_OPTIONS = ['pcs', 'kg', 'ton', 'ltr', 'mtr', 'ft', 'box', 'bag', 'roll', 'set'];
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(initialData ? {
        project_id: initialData.project_id,
        vendor_id: initialData.vendor_id,
        material_name: initialData.material_name ?? '',
        quantity: String(initialData.quantity ?? '1'),
        unit: initialData.unit ?? 'pcs',
        invoice_number: initialData.invoice_number ?? '',
        amount: String(initialData.amount ?? ''),
        gst_amount: String(initialData.gst_amount ?? '0'),
        notes: initialData.notes ?? '',
      } : {
        project_id: undefined, vendor_id: undefined, material_name: '',
        quantity: '1', unit: 'pcs', invoice_number: '', amount: '', gst_amount: '0', notes: '',
      });
      setError(null);
      setDuplicateWarning(null);
      // Show custom unit input if the initial unit is not in the predefined list
      setShowCustomUnit(initialData?.unit ? !UNIT_OPTIONS.includes(initialData.unit) : false);
    }
  }, [visible, initialData]);

  // Duplicate invoice check
  const handleInvoiceCheck = async (invoiceNum: string) => {
    if (!invoiceNum.trim()) { setDuplicateWarning(null); return; }
    try {
      const result = await checkInvoice(invoiceNum, form.vendor_id);
      if (result.hasDuplicate) {
        setDuplicateWarning(`⚠️ Invoice "${invoiceNum}" already exists! (${result.duplicates.length} match${result.duplicates.length > 1 ? 'es' : ''})`);
      } else {
        setDuplicateWarning(null);
      }
    } catch { /* ignore */ }
  };

  const totalAmount = (parseFloat(form.amount || '0') + parseFloat(form.gst_amount || '0'));
  const selectedProject = projects.find((p) => p.id === form.project_id);
  const selectedVendor = vendors.find((v) => v.id === form.vendor_id);

  const handleSave = async () => {
    if (!form.material_name?.trim()) { setError('Material name is required'); return; }
    if (!form.project_id) { setError('Please select a project'); return; }
    if (!form.vendor_id) { setError('Please select a vendor'); return; }
    if (!form.invoice_number?.trim()) { setError('Invoice number is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than 0'); return; }
    if (!form.unit?.trim()) { setError('Unit is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, quantity: parseFloat(form.quantity || '1'), amount: parseFloat(form.amount), gst_amount: parseFloat(form.gst_amount || '0') });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            {/* Header */}
            <View className="bg-blue-500 px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Package size={20} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">{isEditing ? 'Edit Material' : 'New Material Entry'}</Text>
              </View>
              <Pressable onPress={onClose} className="p-1"><X size={20} color="#dbeafe" /></Pressable>
            </View>

            <ScrollView ref={scrollRef} className="p-5" style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              {error && (
                <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
                </View>
              )}
              {duplicateWarning && (
                <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-amber-700 dark:text-amber-400">{duplicateWarning}</Text>
                </View>
              )}

              {/* Project Selector */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Project *</Text>
                <Pressable
                  onPress={() => setShowProjectPicker(!showProjectPicker)}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <FolderOpen size={14} color="#9ca3af" />
                    <Text className={`text-sm ml-2 ${selectedProject ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                      {selectedProject?.name ?? 'Select project'}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#9ca3af" />
                </Pressable>
                {showProjectPicker && (
                  <View className="border border-gray-200 dark:border-gray-700 rounded-xl mt-1 bg-white dark:bg-gray-800 max-h-40 overflow-hidden">
                    <ScrollView style={{ maxHeight: 160 }}>
                      {projects.filter((p) => p.status === 'active').map((p) => (
                        <Pressable
                          key={p.id}
                          onPress={() => { setForm({ ...form, project_id: p.id }); setShowProjectPicker(false); }}
                          className={`px-4 py-2.5 border-b border-gray-50 dark:border-gray-700 ${form.project_id === p.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        >
                          <Text className={`text-sm ${form.project_id === p.id ? 'text-blue-700 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</Text>
                          {p.client_name && <Text className="text-xs text-gray-400">{p.client_name}</Text>}
                        </Pressable>
                      ))}
                      {projects.filter((p) => p.status === 'active').length === 0 && (
                        <Text className="text-sm text-gray-400 p-4 text-center">No active projects</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Vendor Selector */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Vendor *</Text>
                <Pressable
                  onPress={() => setShowVendorPicker(!showVendorPicker)}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Building2 size={14} color="#9ca3af" />
                    <Text className={`text-sm ml-2 ${selectedVendor ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                      {selectedVendor?.name ?? 'Select vendor'}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#9ca3af" />
                </Pressable>
                {showVendorPicker && (
                  <View className="border border-gray-200 dark:border-gray-700 rounded-xl mt-1 bg-white dark:bg-gray-800 max-h-40 overflow-hidden">
                    <ScrollView style={{ maxHeight: 160 }}>
                      {vendors.map((v) => (
                        <Pressable
                          key={v.id}
                          onPress={() => { setForm({ ...form, vendor_id: v.id }); setShowVendorPicker(false); }}
                          className={`px-4 py-2.5 border-b border-gray-50 dark:border-gray-700 ${form.vendor_id === v.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        >
                          <Text className={`text-sm ${form.vendor_id === v.id ? 'text-blue-700 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>{v.name}</Text>
                          {v.phone && <Text className="text-xs text-gray-400">{v.phone}</Text>}
                        </Pressable>
                      ))}
                      {vendors.length === 0 && (
                        <Text className="text-sm text-gray-400 p-4 text-center">No vendors yet</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Material Name */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Material Name *</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.material_name}
                  onChangeText={(t) => setForm({ ...form, material_name: t })}
                  placeholder="e.g., Steel Rods, Cement Bags"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Quantity & Unit */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Quantity</Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.quantity}
                    onChangeText={(t) => setForm({ ...form, quantity: t })}
                    keyboardType="decimal-pad"
                    placeholder="1"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Unit *</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {UNIT_OPTIONS.map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => { setForm({ ...form, unit: u }); setShowCustomUnit(false); }}
                        className={`px-2.5 py-1.5 rounded-lg ${!showCustomUnit && form.unit === u ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                      >
                        <Text className={`text-[10px] font-medium ${!showCustomUnit && form.unit === u ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{u}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => { setShowCustomUnit(true); setForm({ ...form, unit: '' }); }}
                      className={`px-2.5 py-1.5 rounded-lg ${showCustomUnit ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                    >
                      <Text className={`text-[10px] font-medium ${showCustomUnit ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>other</Text>
                    </Pressable>
                  </View>
                  {showCustomUnit && (
                    <TextInput
                      className="border border-blue-300 dark:border-blue-600 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100 mt-2"
                      value={form.unit}
                      onChangeText={(t) => setForm({ ...form, unit: t })}
                      placeholder="Enter custom unit"
                      placeholderTextColor="#9ca3af"
                      autoFocus
                    />
                  )}
                </View>
              </View>

              {/* Invoice Number */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Invoice Number *</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.invoice_number}
                  onChangeText={(t) => { setForm({ ...form, invoice_number: t }); }}
                  onBlur={() => handleInvoiceCheck(form.invoice_number || '')}
                  placeholder="e.g., INV-2026-001"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Amount & GST */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Amount (₹) *</Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.amount}
                    onChangeText={(t) => setForm({ ...form, amount: t })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">GST (₹)</Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.gst_amount}
                    onChangeText={(t) => setForm({ ...form, gst_amount: t })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Total Preview */}
              <View className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 mb-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Amount</Text>
                  <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalAmount)}</Text>
                </View>
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.notes}
                  onChangeText={(t) => setForm({ ...form, notes: t })}
                  placeholder="Optional notes..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
              <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
                <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl items-center ${saving ? 'bg-blue-400' : 'bg-blue-500'}`}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEditing ? 'Update' : 'Add Entry'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Payment Modal (Mark as Paid) ───────────── */

interface PaymentModalProps {
  visible: boolean;
  material: Material | null;
  onClose: () => void;
  onPay: (materialId: number, data: Record<string, any>) => Promise<void>;
}

function PaymentModal({ visible, material, onClose, onPay }: PaymentModalProps) {
  const [form, setForm] = useState({ payment_mode: 'upi', transaction_id: '', notes: '' });
  const [paying, setPaying] = useState(false);
  const MODES = Object.entries(paymentModeConfig);

  useEffect(() => {
    if (visible) setForm({ payment_mode: 'upi', transaction_id: '', notes: '' });
  }, [visible]);

  const handlePay = async () => {
    if (!material) return;
    setPaying(true);
    try {
      await onPay(material.id, form);
      onClose();
    } catch { /* handled by parent */ }
    finally { setPaying(false); }
  };

  if (!material) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            {/* Header */}
            <View className="bg-emerald-500 px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <CreditCard size={20} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">Mark as Paid</Text>
              </View>
              <Pressable onPress={onClose} className="p-1"><X size={20} color="#d1fae5" /></Pressable>
            </View>

            <ScrollView className="p-5" style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {/* Material Info */}
              <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{material.material_name}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{material.project_name} · {material.vendor_name}</Text>
                <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">{formatCurrency(material.total_amount)}</Text>
              </View>

              {/* Payment Mode */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Payment Mode</Text>
                <View className="flex-row flex-wrap gap-2">
                  {MODES.map(([key, cfg]) => (
                    <Pressable
                      key={key}
                      onPress={() => setForm({ ...form, payment_mode: key })}
                      className={`px-3 py-2 rounded-xl border-2 flex-row items-center ${form.payment_mode === key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <Text className="text-sm mr-1">{cfg.icon}</Text>
                      <Text className={`text-xs font-semibold ${form.payment_mode === key ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>{cfg.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Transaction ID */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Transaction ID</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.transaction_id}
                  onChangeText={(t) => setForm({ ...form, transaction_id: t })}
                  placeholder="UPI ref / Bank txn ID"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.notes}
                  onChangeText={(t) => setForm({ ...form, notes: t })}
                  placeholder="Optional"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
              <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
                <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handlePay} disabled={paying} className={`flex-1 py-3 rounded-xl items-center ${paying ? 'bg-emerald-400' : 'bg-emerald-500'}`}>
                {paying ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">Confirm Payment</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Reject Modal ────────────────────────────── */

function RejectModal({ visible, materialName, onConfirm, onCancel }: { visible: boolean; materialName: string; onConfirm: (notes: string) => void; onCancel: () => void }) {
  const [notes, setNotes] = useState('');
  useEffect(() => { if (visible) setNotes(''); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">Reject Material</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Reject "{materialName}"?</Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100 mb-4"
            value={notes}
            onChangeText={setNotes}
            placeholder="Reason for rejection..."
            placeholderTextColor="#9ca3af"
            multiline
            style={{ minHeight: 60, textAlignVertical: 'top' }}
          />
          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(notes)} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Reject</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Delete Modal ────────────────────────────── */

function DeleteModal({ visible, name, onConfirm, onCancel }: { visible: boolean; name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">Delete Entry</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Delete "{name}"? This cannot be undone.</Text>
          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main Materials Page ─────────────────────── */

interface MaterialsPageProps {
  initialFilters?: { status?: string };
  userRole?: string;
}

export function MaterialsPage({ initialFilters, userRole = 'OPERATOR' }: MaterialsPageProps) {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate } = useCompliance();
  const { show: showToast, ToastView } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters?.status ?? 'ALL');
  const [projectFilter, setProjectFilter] = useState<number | undefined>(undefined);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [payingMaterial, setPayingMaterial] = useState<Material | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const isAdmin = userRole === 'ADMIN';
  const isSupervisor = userRole === 'SUPERVISOR' || isAdmin;

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setPageError(null);
      const filters: MaterialFilters = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (projectFilter) filters.project_id = projectFilter;
      if (search) filters.search = search;

      const [matsResult, projResult, vendResult] = await Promise.all([
        fetchMaterials(filters),
        fetchProjects(),
        fetchVendors(),
      ]);
      setMaterials(matsResult.materials);
      setProjects(projResult.projects);
      setVendors(vendResult.vendors);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setPageError(msg);
      if (isRefresh) showToast(msg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, projectFilter, search, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  // CRUD
  const handleSave = async (data: Record<string, any>) => {
    await guardedMutate(editingMaterial ? 'edit' : 'create', async () => {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, data);
        showToast('Material updated', 'success');
      } else {
        await createMaterial(data);
        showToast('Material entry added', 'success');
      }
      setShowForm(false);
      setEditingMaterial(null);
      loadData(true);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guardedMutate('delete', async () => {
      try {
        await deleteMaterial(deleteTarget.id);
        showToast('Entry deleted', 'success');
        setDeleteTarget(null);
        loadData(true);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
        setDeleteTarget(null);
      }
    });
  };

  // Workflow actions
  const handleApprove = async (m: Material) => {
    try {
      await approveMaterial(m.id);
      showToast(`"${m.material_name}" approved`, 'success');
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve', 'error');
    }
  };

  const handleRequestPayment = async (m: Material) => {
    try {
      await requestPayment(m.id);
      showToast(`Payment requested for "${m.material_name}"`, 'success');
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to request payment', 'error');
    }
  };

  const handleReject = async (notes: string) => {
    if (!rejectTarget) return;
    try {
      await rejectMaterial(rejectTarget.id, notes);
      showToast(`"${rejectTarget.material_name}" rejected`, 'success');
      setRejectTarget(null);
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject', 'error');
      setRejectTarget(null);
    }
  };

  const handlePay = async (materialId: number, data: Record<string, any>) => {
    try {
      await markAsPaid(materialId, data as any);
      showToast('Payment recorded!', 'success');
      setPayingMaterial(null);
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to record payment', 'error');
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'payment_requested', label: 'Requested' },
    { key: 'paid', label: 'Paid' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const counts = useMemo(() => ({
    pending: materials.filter((m) => m.status === 'pending').length,
    approved: materials.filter((m) => m.status === 'approved').length,
    payment_requested: materials.filter((m) => m.status === 'payment_requested').length,
    paid: materials.filter((m) => m.status === 'paid').length,
    rejected: materials.filter((m) => m.status === 'rejected').length,
  }), [materials]);

  return (
    <View className="flex-1">
      <ToastView />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <PageHeader
          title="Materials"
          subtitle={`${materials.length} entries`}
          actions={
            <Pressable
              onPress={() => { setEditingMaterial(null); setShowForm(true); }}
              className="bg-blue-500 px-4 py-2.5 rounded-lg flex-row items-center"
            >
              <Plus size={14} color={colors.white} />
              <Text className="text-white font-medium text-sm ml-1">Add Entry</Text>
            </Pressable>
          }
        />

        {/* Status Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              const count = tab.key === 'ALL' ? materials.length : (counts as any)[tab.key] ?? 0;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setStatusFilter(tab.key)}
                  className={`px-3 py-2 rounded-lg border flex-row items-center ${
                    isActive
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {tab.label}
                  </Text>
                  <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text className={`text-[10px] font-bold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Search */}
        <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
          <Search size={14} color={sc.iconMuted} />
          <TextInput
            className="flex-1 text-sm ml-2 text-gray-900 dark:text-gray-100"
            value={search}
            onChangeText={setSearch}
            placeholder="Search materials, invoices..."
            placeholderTextColor="#9ca3af"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}><X size={14} color={sc.iconMuted} /></Pressable>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.blue[500]} />
            <Text className="text-sm text-gray-400 mt-3">Loading materials...</Text>
          </View>
        ) : pageError && materials.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
              <AlertTriangle size={32} color={colors.red[400]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load materials</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1 px-8">{pageError}</Text>
            <Text className="text-xs text-gray-400 text-center mb-5 px-8">Check your connection and try again</Text>
            <Pressable
              onPress={() => loadData()}
              className="flex-row items-center bg-blue-500 px-5 py-2.5 rounded-lg shadow-sm"
            >
              <RefreshCw size={14} color="#fff" />
              <Text className="text-white font-semibold ml-2">Retry</Text>
            </Pressable>
          </View>
        ) : materials.length === 0 ? (
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
              <Package size={32} color={colors.blue[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No material entries</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">Add your first material entry to start tracking</Text>
            <Pressable onPress={() => { setEditingMaterial(null); setShowForm(true); }} className="bg-blue-500 px-5 py-2.5 rounded-lg flex-row items-center">
              <Plus size={14} color={colors.white} />
              <Text className="text-white font-medium text-sm ml-1">Add Entry</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            {materials.map((m) => {
              const cfg = materialStatusConfig[m.status] ?? { label: 'Pending', variant: 'warning' as const, color: '#d97706', bgClass: '' };
              const borderColor =
                m.status === 'paid' ? 'border-l-emerald-400' :
                m.status === 'rejected' ? 'border-l-red-400' :
                m.status === 'payment_requested' ? 'border-l-purple-400' :
                m.status === 'approved' ? 'border-l-blue-400' :
                'border-l-amber-400';
              return (
                <View key={m.id} className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 ${borderColor} p-4 mb-3 shadow-sm`}>
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{m.material_name}</Text>
                      <View className="flex-row items-center mt-0.5">
                        <FolderOpen size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1">{m.project_name}</Text>
                        <Text className="text-xs text-gray-300 mx-1">·</Text>
                        <Building2 size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1">{m.vendor_name}</Text>
                      </View>
                    </View>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </View>

                  {/* Details */}
                  <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                    <View className="flex-row items-center">
                      <IndianRupee size={11} color={sc.iconMuted} />
                      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">{formatCurrency(m.total_amount)}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{m.quantity} {m.unit}</Text>
                    {m.invoice_number && (
                      <View className="flex-row items-center">
                        <FileText size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1 font-mono">{m.invoice_number}</Text>
                      </View>
                    )}
                    <Text className="text-xs text-gray-400">{formatDate(m.created_at)}</Text>
                  </View>

                  {m.created_by_name && (
                    <Text className="text-[10px] text-gray-400 mb-2">By {m.created_by_name}{m.approved_by_name ? ` · Approved by ${m.approved_by_name}` : ''}</Text>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row gap-2 pt-2 border-t border-gray-50 dark:border-gray-700 flex-wrap">
                    {/* Approve (Supervisor+) */}
                    {m.status === 'pending' && isSupervisor && (
                      <Pressable
                        onPress={() => handleApprove(m)}
                        className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <CheckCircle2 size={11} color="#059669" />
                        <Text className="text-xs text-emerald-700 font-medium ml-1">Approve</Text>
                      </Pressable>
                    )}

                    {/* Request Payment (Supervisor+) */}
                    {m.status === 'approved' && isSupervisor && (
                      <Pressable
                        onPress={() => handleRequestPayment(m)}
                        className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <ArrowUpRight size={11} color="#7c3aed" />
                        <Text className="text-xs text-purple-700 font-medium ml-1">Request Payment</Text>
                      </Pressable>
                    )}

                    {/* Mark as Paid (Admin only) */}
                    {(m.status === 'payment_requested' || m.status === 'approved') && isAdmin && (
                      <Pressable
                        onPress={() => setPayingMaterial(m)}
                        className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <CreditCard size={11} color="#059669" />
                        <Text className="text-xs text-emerald-700 font-medium ml-1">Mark Paid</Text>
                      </Pressable>
                    )}

                    {/* Reject (Supervisor+) */}
                    {(m.status === 'pending' || m.status === 'approved') && isSupervisor && (
                      <Pressable
                        onPress={() => setRejectTarget(m)}
                        className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <Ban size={11} color="#dc2626" />
                        <Text className="text-xs text-red-700 font-medium ml-1">Reject</Text>
                      </Pressable>
                    )}

                    {/* Edit (only pending) */}
                    {m.status === 'pending' && (
                      <Pressable
                        onPress={() => { setEditingMaterial(m); setShowForm(true); }}
                        className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <Pencil size={11} color="#2563eb" />
                        <Text className="text-xs text-blue-700 font-medium ml-1">Edit</Text>
                      </Pressable>
                    )}

                    {/* Delete (Supervisor+, not paid) */}
                    {m.status !== 'paid' && isSupervisor && (
                      <Pressable
                        onPress={() => setDeleteTarget(m)}
                        className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex-row items-center"
                      >
                        <Trash2 size={11} color="#dc2626" />
                        <Text className="text-xs text-red-700 font-medium ml-1">Delete</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Modals */}
      <MaterialFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingMaterial(null); }}
        onSave={handleSave}
        projects={projects}
        vendors={vendors}
        initialData={editingMaterial ?? undefined}
        isEditing={!!editingMaterial}
      />
      <PaymentModal
        visible={!!payingMaterial}
        material={payingMaterial}
        onClose={() => setPayingMaterial(null)}
        onPay={handlePay}
      />
      <RejectModal
        visible={!!rejectTarget}
        materialName={rejectTarget?.material_name ?? ''}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
      <DeleteModal
        visible={!!deleteTarget}
        name={deleteTarget?.material_name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
