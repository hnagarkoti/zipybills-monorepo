/**
 * PayTrack Projects Page – Project CRUD with budget tracking
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, RefreshControl,
} from 'react-native';
import {
  FolderOpen, Plus, Search, X, Eye, Pencil, Trash2,
  CheckCircle2, AlertTriangle, Clock, Pause, IndianRupee, RefreshCw,
} from 'lucide-react-native';
import { Badge, PageHeader } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';
import { fetchProjects, createProject, updateProject, deleteProject, type Project } from '../services/api';
import { formatCurrency, useToast } from '../hooks/usePayTrack';

/* ─── Project Form Modal ──────────────────────── */

interface ProjectFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  initialData?: Project;
  isEditing: boolean;
}

function ProjectFormModal({ visible, onClose, onSave, initialData, isEditing }: ProjectFormProps) {
  const [form, setForm] = useState({ name: '', client_name: '', description: '', budget: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STATUS_OPTIONS = [
    { key: 'active', label: 'Active', icon: '🟢' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'on_hold', label: 'On Hold', icon: '⏸' },
  ];

  useEffect(() => {
    if (visible) {
      setForm(initialData ? {
        name: initialData.name,
        client_name: initialData.client_name ?? '',
        description: initialData.description ?? '',
        budget: initialData.budget ? String(initialData.budget) : '',
        status: initialData.status,
      } : { name: '', client_name: '', description: '', budget: '', status: 'active' });
      setError(null);
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true); setError(null);
    try {
      await onSave({ ...form, budget: form.budget ? parseFloat(form.budget) : null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <View className="bg-indigo-500 px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <FolderOpen size={20} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">{isEditing ? 'Edit Project' : 'New Project'}</Text>
              </View>
              <Pressable onPress={onClose} className="p-1"><X size={20} color="#e0e7ff" /></Pressable>
            </View>

            <ScrollView className="p-5" style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
              {error && (
                <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Project Name *</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                  placeholder="e.g., Building A Construction"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Client Name</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.client_name}
                  onChangeText={(t) => setForm({ ...form, client_name: t })}
                  placeholder="e.g., ABC Corp"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Description</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.description}
                  onChangeText={(t) => setForm({ ...form, description: t })}
                  placeholder="Project details..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Budget (₹)</Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={form.budget}
                  onChangeText={(t) => setForm({ ...form, budget: t })}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {isEditing && (
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Status</Text>
                  <View className="flex-row gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <Pressable
                        key={s.key}
                        onPress={() => setForm({ ...form, status: s.key })}
                        className={`flex-1 px-3 py-2.5 rounded-xl border-2 items-center ${
                          form.status === s.key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <Text className="text-sm mb-0.5">{s.icon}</Text>
                        <Text className={`text-xs font-semibold ${form.status === s.key ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>{s.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
              <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
                <Text className="text-gray-600 dark:text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl items-center ${saving ? 'bg-indigo-400' : 'bg-indigo-500'}`}>
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

function ProjectDeleteModal({ visible, name, onConfirm, onCancel }: { visible: boolean; name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">Delete Project</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Delete "{name}"? All material entries under this project will also be deleted.</Text>
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

/* ─── Main Projects Page ──────────────────────── */

interface ProjectsPageProps {
  userRole?: string;
}

export function ProjectsPage({ userRole = 'OPERATOR' }: ProjectsPageProps) {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate } = useCompliance();
  const { show: showToast, ToastView } = useToast();

  const canWrite = ['ADMIN', 'SUPERVISOR'].includes(userRole);
  const canDelete = userRole === 'ADMIN';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setPageError(null);
      const result = await fetchProjects();
      setProjects(result.projects);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      setPageError(msg);
      if (isRefresh) showToast(msg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  const handleSave = async (data: Record<string, any>) => {
    await guardedMutate(editingProject ? 'edit' : 'create', async () => {
      if (editingProject) {
        await updateProject(editingProject.id, data);
        showToast('Project updated', 'success');
      } else {
        await createProject(data);
        showToast('Project created', 'success');
      }
      setShowForm(false);
      setEditingProject(null);
      loadData(true);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guardedMutate('delete', async () => {
      try {
        await deleteProject(deleteTarget.id);
        showToast('Project deleted', 'success');
        setDeleteTarget(null);
        loadData(true);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
        setDeleteTarget(null);
      }
    });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.client_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, statusFilter, search]);

  const statusVariant = (s: string) =>
    s === 'active' ? 'success' as const : s === 'completed' ? 'info' as const : 'warning' as const;

  const statusIcon = (s: string) =>
    s === 'active' ? <CheckCircle2 size={11} color="#059669" /> :
    s === 'completed' ? <CheckCircle2 size={11} color="#2563eb" /> :
    <Pause size={11} color="#d97706" />;

  return (
    <View className="flex-1">
      <ToastView />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <PageHeader
          title="Projects"
          subtitle={`${projects.length} projects`}
          actions={
            canWrite ? (
              <Pressable onPress={() => { setEditingProject(null); setShowForm(true); }} className="bg-indigo-500 px-4 py-2.5 rounded-lg flex-row items-center">
                <Plus size={14} color={colors.white} />
                <Text className="text-white font-medium text-sm ml-1">Add Project</Text>
              </Pressable>
            ) : undefined
          }
        />

        {/* Status Filter Tabs */}
        {projects.length > 0 && (
          <View className="flex-row gap-2 mb-4">
            {[{ key: 'ALL', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'on_hold', label: 'On Hold' }].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                className={`px-3 py-2 rounded-lg border ${
                  statusFilter === tab.key ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <Text className={`text-xs font-semibold ${statusFilter === tab.key ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Search */}
        {projects.length > 0 && (
          <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
            <Search size={14} color={sc.iconMuted} />
            <TextInput
              className="flex-1 text-sm ml-2 text-gray-900 dark:text-gray-100"
              value={search} onChangeText={setSearch}
              placeholder="Search projects..." placeholderTextColor="#9ca3af"
            />
            {search.length > 0 && <Pressable onPress={() => setSearch('')}><X size={14} color={sc.iconMuted} /></Pressable>}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.blue[500]} />
          </View>
        ) : pageError && projects.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
              <AlertTriangle size={32} color={colors.red[400]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load projects</Text>
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
        ) : filteredProjects.length === 0 && projects.length === 0 ? (
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mb-4">
              <FolderOpen size={32} color={colors.blue[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No projects yet</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">{canWrite ? 'Create your first project to start tracking materials' : 'No projects available yet'}</Text>
            {canWrite && (
              <Pressable onPress={() => { setEditingProject(null); setShowForm(true); }} className="bg-indigo-500 px-5 py-2.5 rounded-lg flex-row items-center">
                <Plus size={14} color={colors.white} />
                <Text className="text-white font-medium text-sm ml-1">Add Project</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            {filteredProjects.map((p) => {
              const budgetPct = p.budget && Number(p.budget) > 0
                ? Math.round((Number(p.total_requested ?? 0) / Number(p.budget)) * 100)
                : null;
              const isOverBudget = budgetPct !== null && budgetPct > 100;
              return (
                <View key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-3 shadow-sm">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <FolderOpen size={16} color={sc.iconDefault} />
                        <Text className="text-base font-bold text-gray-900 dark:text-gray-100 ml-2">{p.name}</Text>
                      </View>
                      {p.client_name && <Text className="text-xs text-gray-400 ml-6">{p.client_name}</Text>}
                    </View>
                    <Badge variant={statusVariant(p.status)}>
                      {p.status === 'active' ? 'Active' : p.status === 'completed' ? 'Completed' : 'On Hold'}
                    </Badge>
                  </View>

                  {p.description && <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">{p.description}</Text>}

                  {/* Stats */}
                  <View className="flex-row gap-2 mb-2">
                    <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <Text className="text-[10px] text-gray-400">Materials</Text>
                      <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{p.material_count ?? 0}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <Text className="text-[10px] text-gray-400">Requested</Text>
                      <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(p.total_requested)}</Text>
                    </View>
                    <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2">
                      <Text className="text-[10px] text-emerald-600">Paid</Text>
                      <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.total_paid)}</Text>
                    </View>
                    {Number(p.pending_amount) > 0 && (
                      <View className="flex-1 bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
                        <Text className="text-[10px] text-red-600">Pending</Text>
                        <Text className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(p.pending_amount)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Budget bar */}
                  {budgetPct !== null && (
                    <View className="mb-2">
                      <View className="flex-row justify-between mb-0.5">
                        <Text className="text-[10px] text-gray-400">Budget: {formatCurrency(p.budget)}</Text>
                        <Text className={`text-[10px] font-bold ${isOverBudget ? 'text-red-500' : 'text-gray-500'}`}>{budgetPct}%</Text>
                      </View>
                      <View className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full ${isOverBudget ? 'bg-red-400' : budgetPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, budgetPct)}%` }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Actions — only for users with write/delete permissions */}
                  {(canWrite || canDelete) && (
                    <View className="flex-row gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                      {canWrite && (
                        <Pressable
                          onPress={() => { setEditingProject(p); setShowForm(true); }}
                          className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex-row items-center"
                        >
                          <Pencil size={11} color="#2563eb" />
                          <Text className="text-xs text-blue-700 font-medium ml-1">Edit</Text>
                        </Pressable>
                      )}
                      {canDelete && (
                        <Pressable
                          onPress={() => setDeleteTarget(p)}
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

      <ProjectFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingProject(null); }}
        onSave={handleSave}
        initialData={editingProject ?? undefined}
        isEditing={!!editingProject}
      />
      <ProjectDeleteModal
        visible={!!deleteTarget}
        name={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
