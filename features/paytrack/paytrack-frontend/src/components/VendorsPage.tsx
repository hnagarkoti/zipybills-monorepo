/**
 * PayTrack Vendors Page – Vendor management with payment summaries
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, RefreshControl,
} from 'react-native';
import {
  Building2, Plus, Search, X, Pencil, Trash2, Phone, Mail, MapPin, FileText, IndianRupee,
  AlertTriangle, RefreshCw,
} from 'lucide-react-native';
import { Badge, PageHeader } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';
import { fetchVendors, createVendor, updateVendor, deleteVendor, type Vendor } from '../services/api';
import { formatCurrency, useToast } from '../hooks/usePayTrack';

/* ─── Vendor Form Modal ───────────────────────── */

interface VendorFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  initialData?: Vendor;
  isEditing: boolean;
}

function VendorFormModal({ visible, onClose, onSave, initialData, isEditing }: VendorFormProps) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(initialData ? {
        name: initialData.name, phone: initialData.phone ?? '', email: initialData.email ?? '',
        gstin: initialData.gstin ?? '', address: initialData.address ?? '', notes: initialData.notes ?? '',
      } : { name: '', phone: '', email: '', gstin: '', address: '', notes: '' });
      setError(null);
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vendor name is required'); return; }
    setSaving(true); setError(null);
    try { await onSave(form); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <View className="bg-blue-600 px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Building2 size={20} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">{isEditing ? 'Edit Vendor' : 'New Vendor'}</Text>
              </View>
              <Pressable onPress={onClose} className="p-1"><X size={20} color="#bfdbfe" /></Pressable>
            </View>

            <ScrollView className="p-5" style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              {error && (
                <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Vendor Name *</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.name} onChangeText={(t) => setForm({ ...form, name: t })}
                  placeholder="e.g., Tata Steel Distributors" placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })}
                    keyboardType="phone-pad" placeholder="9876543210" placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                    value={form.email} onChangeText={(t) => setForm({ ...form, email: t })}
                    keyboardType="email-address" placeholder="vendor@example.com" placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">GSTIN</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.gstin} onChangeText={(t) => setForm({ ...form, gstin: t.toUpperCase() })}
                  placeholder="e.g., 22AAAAA0000A1Z5" placeholderTextColor="#9ca3af" autoCapitalize="characters"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Address</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.address} onChangeText={(t) => setForm({ ...form, address: t })}
                  placeholder="Full address" placeholderTextColor="#9ca3af"
                  multiline numberOfLines={2} style={{ minHeight: 50, textAlignVertical: 'top' }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })}
                  placeholder="Internal notes..." placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
              <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
                <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl items-center ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEditing ? 'Update' : 'Create'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Delete Modal ────────────────────────────── */

function VendorDeleteModal({ visible, name, onConfirm, onCancel }: { visible: boolean; name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">Delete Vendor</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Delete "{name}"? This action cannot be undone.</Text>
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

/* ─── Main Vendors Page ───────────────────────── */

interface VendorsPageProps {
  userRole?: string;
}

export function VendorsPage({ userRole = 'OPERATOR' }: VendorsPageProps) {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate } = useCompliance();
  const { show: showToast, ToastView } = useToast();

  const canWrite = ['ADMIN', 'SUPERVISOR'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setPageError(null);
      const result = await fetchVendors();
      setVendors(result.vendors);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load vendors';
      setPageError(msg);
      if (isRefresh) showToast(msg, 'error');
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  const handleSave = async (data: Record<string, any>) => {
    await guardedMutate(editingVendor ? 'edit' : 'create', async () => {
      if (editingVendor) {
        await updateVendor(editingVendor.id, data);
        showToast('Vendor updated', 'success');
      } else {
        await createVendor(data);
        showToast('Vendor created', 'success');
      }
      setShowForm(false);
      setEditingVendor(null);
      loadData(true);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guardedMutate('delete', async () => {
      try {
        await deleteVendor(deleteTarget.id);
        showToast('Vendor deleted', 'success');
        setDeleteTarget(null);
        loadData(true);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
        setDeleteTarget(null);
      }
    });
  };

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    return vendors.filter((v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.gstin?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vendors, search]);

  return (
    <View className="flex-1">
      <ToastView />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <PageHeader
          title="Vendors"
          subtitle={`${vendors.length} vendors`}
          actions={
            canWrite ? (
              <Pressable onPress={() => { setEditingVendor(null); setShowForm(true); }} className="bg-blue-600 px-4 py-2.5 rounded-lg flex-row items-center">
                <Plus size={14} color={colors.white} />
                <Text className="text-white font-medium text-sm ml-1">Add Vendor</Text>
              </Pressable>
            ) : undefined
          }
        />

        {/* Search */}
        {vendors.length > 0 && (
          <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
            <Search size={14} color={sc.iconMuted} />
            <TextInput
              className="flex-1 text-sm ml-2 text-gray-900 dark:text-gray-100"
              value={search} onChangeText={setSearch}
              placeholder="Search vendors..." placeholderTextColor="#9ca3af"
            />
            {search.length > 0 && <Pressable onPress={() => setSearch('')}><X size={14} color={sc.iconMuted} /></Pressable>}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View className="items-center py-12"><ActivityIndicator size="large" color={colors.blue[500]} /></View>
        ) : pageError && vendors.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
              <AlertTriangle size={32} color={colors.red[400]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load vendors</Text>
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
        ) : filteredVendors.length === 0 && vendors.length === 0 ? (
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
              <Building2 size={32} color={colors.blue[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No vendors yet</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">{canWrite ? 'Add your material suppliers' : 'No vendors available yet'}</Text>
            {canWrite && (
              <Pressable onPress={() => { setEditingVendor(null); setShowForm(true); }} className="bg-blue-600 px-5 py-2.5 rounded-lg flex-row items-center">
                <Plus size={14} color={colors.white} />
                <Text className="text-white font-medium text-sm ml-1">Add Vendor</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {filteredVendors.map((v) => {
              const outstanding = Number(v.total_billed ?? 0) - Number(v.total_paid ?? 0);
              return (
                <View key={v.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-3 shadow-sm">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                        <Building2 size={18} color={colors.blue[500]} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{v.name}</Text>
                        {v.gstin && <Text className="text-xs text-gray-400 font-mono">{v.gstin}</Text>}
                      </View>
                    </View>
                    <Badge variant={Number(v.material_count) > 0 ? 'info' : 'outline'}>
                      {v.material_count ?? 0} items
                    </Badge>
                  </View>

                  {/* Contact info */}
                  <View className="flex-row flex-wrap gap-3 mb-2">
                    {v.phone && (
                      <View className="flex-row items-center">
                        <Phone size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">{v.phone}</Text>
                      </View>
                    )}
                    {v.email && (
                      <View className="flex-row items-center">
                        <Mail size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">{v.email}</Text>
                      </View>
                    )}
                    {v.address && (
                      <View className="flex-row items-center">
                        <MapPin size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>{v.address}</Text>
                      </View>
                    )}
                  </View>

                  {/* Financial summary */}
                  {Number(v.total_billed) > 0 && (
                    <View className="flex-row gap-2 mb-2">
                      <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <Text className="text-[10px] text-gray-400">Total Billed</Text>
                        <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(v.total_billed)}</Text>
                      </View>
                      <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2">
                        <Text className="text-[10px] text-emerald-600">Paid</Text>
                        <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(v.total_paid)}</Text>
                      </View>
                      {outstanding > 0 && (
                        <View className="flex-1 bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
                          <Text className="text-[10px] text-red-600">Outstanding</Text>
                          <Text className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(outstanding)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Actions — only for users with write/delete permissions */}
                  {(canWrite || canDelete) && (
                    <View className="flex-row gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                      {canWrite && (
                        <Pressable
                          onPress={() => { setEditingVendor(v); setShowForm(true); }}
                          className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex-row items-center"
                        >
                          <Pencil size={11} color="#2563eb" />
                          <Text className="text-xs text-blue-700 font-medium ml-1">Edit</Text>
                        </Pressable>
                      )}
                      {canDelete && (
                        <Pressable
                          onPress={() => setDeleteTarget(v)}
                          className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex-row items-center"
                        >
                          <Trash2 size={11} color="#dc2626" />
                          <Text className="text-xs text-red-700 font-medium ml-1">Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <VendorFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingVendor(null); }}
        onSave={handleSave}
        initialData={editingVendor ?? undefined}
        isEditing={!!editingVendor}
      />
      <VendorDeleteModal
        visible={!!deleteTarget}
        name={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
